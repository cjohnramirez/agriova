/**
 * Runs the generated Drizzle migration against a real in-memory SQLite database
 * and checks that the profit view computes what a hand-written ledger says it
 * should.
 *
 * This is not a substitute for running the app. It exists because the profit
 * figure is the product: if `cycle_pnl` is wrong, every screen built on top of
 * it is wrong, and that is worth catching in a second rather than on a device.
 *
 * Run with: npm run verify:schema
 */
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const DRIZZLE_DIR = join(process.cwd(), 'drizzle');
const PESO = 100; // centavos

let failures = 0;

function check(label, actual, expected) {
  const ok = actual === expected;
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) console.log(`      expected ${expected}, got ${actual}`);
}

// --- Apply every migration, in journal order ------------------------------

const db = new DatabaseSync(':memory:');
db.exec('PRAGMA foreign_keys = ON;');

const migrationFiles = readdirSync(DRIZZLE_DIR)
  .filter((f) => f.endsWith('.sql'))
  .sort();

if (migrationFiles.length === 0) {
  console.error('No migrations found. Run `npx drizzle-kit generate` first.');
  process.exit(1);
}

for (const file of migrationFiles) {
  const sql = readFileSync(join(DRIZZLE_DIR, file), 'utf8');
  // Drizzle separates statements with its own breakpoint marker.
  for (const statement of sql.split('--> statement-breakpoint')) {
    const trimmed = statement.trim();
    if (trimmed) db.exec(trimmed);
  }
  console.log(`applied ${file}`);
}
console.log('');

// --- Seed a realistic smallholder season ----------------------------------
// One quarter hectare of tomatoes. Numbers are the scale a real CDO smallholder
// works at, deliberately not the 129 hectares in the old mockup.

const now = Date.now();
const owner = 'owner-1';
const sync = (extra = {}) => ({ owner_id: owner, created_at: now, updated_at: now, deleted_at: null, ...extra });

db.prepare(
  `insert into crop (id, name_bis, name_en, icon, shelf_life_days, default_unit, sort_order, updated_at)
   values (?, ?, ?, ?, ?, ?, ?, ?)`,
).run('crop-tomato', 'Kamatis', 'Tomato', 'Cherry', 7, 'kg', 1, now);

db.prepare(
  `insert into plot (id, name, area_sqm, photo_uri, owner_id, created_at, updated_at, deleted_at)
   values (?, ?, ?, ?, ?, ?, ?, ?)`,
).run('plot-1', 'Luna sa Gusa', 2500, null, owner, now, now, null);

db.prepare(
  `insert into cycle (id, plot_id, crop_id, planted_on, expected_harvest_on, status, owner_id, created_at, updated_at, deleted_at)
   values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
).run('cycle-1', 'plot-1', 'crop-tomato', '2026-06-01', '2026-08-15', 'growing', owner, now, now, null);

const addExpense = db.prepare(
  `insert into expense (id, cycle_id, category, amount_centavos, spent_on, note, photo_uri, owner_id, created_at, updated_at, deleted_at)
   values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);
addExpense.run('exp-seed', 'cycle-1', 'seed', 1200 * PESO, '2026-06-01', null, null, owner, now, now, null);
addExpense.run('exp-fert', 'cycle-1', 'fertilizer', 3400 * PESO, '2026-06-10', null, null, owner, now, now, null);
addExpense.run('exp-labor', 'cycle-1', 'labor', 5000 * PESO, '2026-07-02', null, null, owner, now, now, null);
// 9,600 pesos spent so far.

db.prepare(
  `insert into harvest (id, cycle_id, quantity_milli, unit, harvested_on, quality, photo_uri, owner_id, created_at, updated_at, deleted_at)
   values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
).run('harvest-1', 'cycle-1', 420_000, 'kg', '2026-08-14', 'good', null, owner, now, now, null);
// 420 kg.

const addSale = db.prepare(
  `insert into sale (id, harvest_id, channel, buyer_name, quantity_milli, unit_price_centavos, total_centavos, sold_on, owner_id, created_at, updated_at, deleted_at)
   values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
);
// 250 kg to a middleman at 38 pesos, then 170 kg direct at 55 pesos.
addSale.run('sale-1', 'harvest-1', 'middleman', 'Kuya Ben', 250_000, 38 * PESO, 9500 * PESO, '2026-08-15', owner, now, now, null);
addSale.run('sale-2', 'harvest-1', 'direct', 'Palengke', 170_000, 55 * PESO, 9350 * PESO, '2026-08-16', owner, now, now, null);

const pnl = () => db.prepare('select * from cycle_pnl where cycle_id = ?').get('cycle-1');

// --- Checks ---------------------------------------------------------------

let row = pnl();
check('revenue sums both sales', row.revenue_centavos, 18_850 * PESO);
check('expenses sum all three', row.expense_centavos, 9_600 * PESO);
check('net is revenue minus expenses', row.net_centavos, 9_250 * PESO);

// A soft-deleted expense must correct the figure immediately.
db.prepare('update expense set deleted_at = ? where id = ?').run(now, 'exp-labor');
row = pnl();
check('soft-deleted expense drops out', row.expense_centavos, 4_600 * PESO);
check('net rises after the deletion', row.net_centavos, 14_250 * PESO);

// A soft-deleted harvest must take its sales out of revenue with it.
db.prepare('update harvest set deleted_at = ? where id = ?').run(now, 'harvest-1');
row = pnl();
check('deleting a harvest removes its sales from revenue', row.revenue_centavos, 0);

// A cycle with nothing recorded reports zero, not null. A null would render as
// "₱NaN" on the home screen.
db.prepare(
  `insert into cycle (id, plot_id, crop_id, planted_on, expected_harvest_on, status, owner_id, created_at, updated_at, deleted_at)
   values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
).run('cycle-empty', 'plot-1', 'crop-tomato', '2026-09-01', null, 'growing', owner, now, now, null);
const empty = db.prepare('select * from cycle_pnl where cycle_id = ?').get('cycle-empty');
check('an empty cycle reports zero revenue', empty.revenue_centavos, 0);
check('an empty cycle reports zero net', empty.net_centavos, 0);

// Foreign keys must actually be enforced, or orphaned rows will desync.
let rejected = false;
try {
  addExpense.run('exp-orphan', 'cycle-missing', 'seed', 100, '2026-06-01', null, null, owner, now, now, null);
} catch {
  rejected = true;
}
check('an expense on a missing cycle is rejected', rejected, true);

// --- Constraints ----------------------------------------------------------
// These matter because synced rows arrive from the server without ever passing
// through TypeScript. The union types protect this app; only the CHECK
// constraints protect the database.

function rejects(label, fn) {
  let threw = false;
  try {
    fn();
  } catch {
    threw = true;
  }
  check(label, threw, true);
}

console.log('');
rejects('an invalid cycle status is rejected', () =>
  db.prepare('update cycle set status = ? where id = ?').run('banana', 'cycle-1'),
);
rejects('a negative expense amount is rejected', () =>
  addExpense.run('exp-neg', 'cycle-1', 'seed', -500, '2026-06-01', null, null, owner, now, now, null),
);
rejects('an unknown expense category is rejected', () =>
  addExpense.run('exp-bad', 'cycle-1', 'crypto', 500, '2026-06-01', null, null, owner, now, now, null),
);
rejects('a zero-quantity sale is rejected', () =>
  addSale.run('sale-zero', 'harvest-1', 'direct', null, 0, 100, 0, '2026-08-16', owner, now, now, null),
);
rejects('a price band with median below low is rejected', () =>
  db
    .prepare(
      `insert into price_reference (id, crop_id, area_code, observed_on, low_centavos, median_centavos, high_centavos, unit, updated_at)
       values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run('pr-bad', 'crop-tomato', 'CDO', '2026-08-15', 5000, 4000, 6000, 'kg', now),
);
rejects('a zero-area plot is rejected', () =>
  db
    .prepare(
      `insert into plot (id, name, area_sqm, photo_uri, owner_id, created_at, updated_at, deleted_at)
       values (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run('plot-bad', 'Wala', 0, null, owner, now, now, null),
);

console.log(`\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
