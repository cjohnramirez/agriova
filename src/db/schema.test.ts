/**
 * Runs the real migrations and checks that the profit view computes what a
 * hand-written ledger says it should. The profit figure is the product: if
 * `cycle_pnl` is wrong, every screen built on top of it is wrong.
 */
import { RESET_LOCAL_DATA_SQL } from './reset';
import { openTestDb, type TestDb } from './testing/openTestDb';

const PESO = 100; // centavos
const now = Date.now();
const owner = 'owner-1';

// One quarter hectare of tomatoes, at the scale a real CDO smallholder works.
function seedSeason(db: TestDb) {
  db.prepare(
    `insert into crop (id, name_bis, name_en, icon, shelf_life_days, default_unit, sort_order, updated_at)
     values (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run('crop-tomato', 'Kamatis', 'Tomato', 'Cherry', 7, 'kg', 1, now);
  db.prepare(
    `insert into plot (id, name, area_sqm, photo_uri, owner_id, created_at, updated_at, deleted_at)
     values (?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run('plot-1', 'Luna sa Gusa', 2500, null, owner, now, now, null);
  addCycle(db, 'cycle-1', '2026-06-01');

  addExpense(db, 'exp-seed', 'seed', 1200 * PESO);
  addExpense(db, 'exp-fert', 'fertilizer', 3400 * PESO);
  addExpense(db, 'exp-labor', 'labor', 5000 * PESO);

  db.prepare(
    `insert into harvest (id, cycle_id, quantity_milli, unit, harvested_on, quality, photo_uri, owner_id, created_at, updated_at, deleted_at)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run('harvest-1', 'cycle-1', 420_000, 'kg', '2026-08-14', 'good', null, owner, now, now, null);

  // 250 kg to a middleman at 38 pesos, then 170 kg direct at 55 pesos.
  addSale(db, 'sale-1', 'middleman', 250_000, 38 * PESO, 9500 * PESO);
  addSale(db, 'sale-2', 'direct', 170_000, 55 * PESO, 9350 * PESO);
}

function addCycle(db: TestDb, id: string, plantedOn: string) {
  db.prepare(
    `insert into cycle (id, plot_id, crop_id, planted_on, expected_harvest_on, status, owner_id, created_at, updated_at, deleted_at)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, 'plot-1', 'crop-tomato', plantedOn, null, 'growing', owner, now, now, null);
}

function addExpense(db: TestDb, id: string, category: string, amount: number, cycleId = 'cycle-1') {
  db.prepare(
    `insert into expense (id, cycle_id, category, amount_centavos, spent_on, note, photo_uri, owner_id, created_at, updated_at, deleted_at)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, cycleId, category, amount, '2026-06-01', null, null, owner, now, now, null);
}

function addSale(
  db: TestDb,
  id: string,
  channel: string,
  qty: number,
  price: number,
  total: number,
) {
  db.prepare(
    `insert into sale (id, harvest_id, channel, buyer_name, quantity_milli, unit_price_centavos, total_centavos, sold_on, owner_id, created_at, updated_at, deleted_at)
     values (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
  ).run(id, 'harvest-1', channel, null, qty, price, total, '2026-08-16', owner, now, now, null);
}

const pnl = (db: TestDb, cycleId = 'cycle-1') =>
  db.prepare('select * from cycle_pnl where cycle_id = ?').get(cycleId);

let db: TestDb;
beforeEach(() => {
  db = openTestDb();
  seedSeason(db);
});
afterEach(() => db.close());

describe('cycle_pnl', () => {
  it('sums revenue, expenses and net', () => {
    expect(pnl(db)).toMatchObject({
      revenue_centavos: 18_850 * PESO,
      expense_centavos: 9_600 * PESO,
      net_centavos: 9_250 * PESO,
    });
  });

  it('drops a soft-deleted expense immediately', () => {
    db.prepare('update expense set deleted_at = ? where id = ?').run(now, 'exp-labor');
    expect(pnl(db)).toMatchObject({ expense_centavos: 4_600 * PESO, net_centavos: 14_250 * PESO });
  });

  it('takes a deleted harvest’s sales out of revenue', () => {
    db.prepare('update harvest set deleted_at = ? where id = ?').run(now, 'harvest-1');
    expect(pnl(db)).toMatchObject({ revenue_centavos: 0 });
  });

  // A null would render as "₱NaN" on the home screen.
  it('reports zero, not null, for an empty cycle', () => {
    addCycle(db, 'cycle-empty', '2026-09-01');
    expect(pnl(db, 'cycle-empty')).toMatchObject({
      revenue_centavos: 0,
      expense_centavos: 0,
      net_centavos: 0,
    });
  });

  // The view aggregates per cycle; one cycle's money must never leak into another.
  it('keeps each cycle’s money separate', () => {
    addCycle(db, 'cycle-2', '2026-09-01');
    addExpense(db, 'exp-c2', 'seed', 700 * PESO, 'cycle-2');
    expect(pnl(db)).toMatchObject({ expense_centavos: 9_600 * PESO });
    expect(pnl(db, 'cycle-2')).toMatchObject({
      revenue_centavos: 0,
      expense_centavos: 700 * PESO,
      net_centavos: -700 * PESO,
    });
  });

  it('returns one row per cycle', () => {
    addCycle(db, 'cycle-2', '2026-09-01');
    expect(db.prepare('select count(*) as n from cycle_pnl').get()).toEqual({ n: 2 });
  });
});

describe('constraints', () => {
  // Synced rows arrive from the server without passing through TypeScript. The
  // union types protect this app; only the CHECK constraints protect the data.
  it('rejects an expense on a missing cycle', () =>
    expect(() => addExpense(db, 'x', 'seed', 100, 'cycle-missing')).toThrow());
  it('rejects an invalid cycle status', () =>
    expect(() =>
      db.prepare('update cycle set status = ? where id = ?').run('banana', 'cycle-1'),
    ).toThrow());
  it('rejects a negative expense', () => expect(() => addExpense(db, 'x', 'seed', -500)).toThrow());
  it('rejects an unknown expense category', () =>
    expect(() => addExpense(db, 'x', 'crypto', 500)).toThrow());
  it('rejects a zero-quantity sale', () =>
    expect(() => addSale(db, 'x', 'direct', 0, 100, 0)).toThrow());
  it('rejects a price band with median below low', () =>
    expect(() =>
      db
        .prepare(
          `insert into price_reference (id, crop_id, area_code, observed_on, low_centavos, median_centavos, high_centavos, unit, updated_at)
           values (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run('pr-bad', 'crop-tomato', 'CDO', '2026-08-15', 5000, 4000, 6000, 'kg', now),
    ).toThrow());
  it('rejects a zero-area plot', () =>
    expect(() =>
      db
        .prepare(
          `insert into plot (id, name, area_sqm, photo_uri, owner_id, created_at, updated_at, deleted_at)
           values (?, ?, ?, ?, ?, ?, ?, ?)`,
        )
        .run('plot-bad', 'Wala', 0, null, owner, now, now, null),
    ).toThrow());
});

describe('resetting local data', () => {
  it('clears every farmer table and keeps reference data', () => {
    db.exec(RESET_LOCAL_DATA_SQL);
    for (const table of ['sale', 'harvest', 'expense', 'cycle', 'plot', 'outbox', 'sync_state']) {
      expect(db.prepare(`select count(*) as n from ${table}`).get()).toEqual({ n: 0 });
    }
    expect(db.prepare('select count(*) as n from crop').get()).toEqual({ n: 1 });
  });
});
