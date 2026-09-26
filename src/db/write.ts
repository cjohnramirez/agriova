import type { SqlReader } from './read';
import type { ExpenseCategory, SaleChannel, Unit } from './schema';
import { saleTotalCentavos } from './units';

/**
 * Every farmer-authored write goes through here, so a row and its outbox entry
 * are always inserted in the same transaction. That is the guarantee the sync
 * engine relies on: nothing can exist locally without a pending push.
 *
 * Written against a tiny SQL interface rather than Drizzle so the exact same
 * code runs on the device (expo-sqlite) and in tests (node:sqlite).
 *
 * Each writer checks that what it points at belongs to the same farmer and is
 * not deleted. The screens only ever offer valid choices, but a write that
 * trusted its caller would let one bad tap attach a sale to someone else's
 * harvest, and the server would reject it long after the farmer walked away.
 */

export type SqlValue = string | number | null;

export interface SqlRunner {
  run(sql: string, params: SqlValue[]): void;
  transaction(work: () => void): void;
}

/** A runner that can also read, for writers that validate before writing. */
export interface SqlDb extends SqlRunner, SqlReader {}

export type Clock = { now: () => number; uuid: () => string };

/** Thrown for input a farmer can fix. `code` picks the message the form shows. */
export class WriteError extends Error {
  constructor(
    readonly code: 'required' | 'notFound' | 'tooMuch' | 'notPositive',
    message: string,
  ) {
    super(message);
  }
}

type Row = Record<string, SqlValue>;

function queue(
  db: SqlRunner,
  table: string,
  id: string,
  op: 'insert' | 'update',
  payload: Row,
  clock: Clock,
  now: number,
) {
  db.run(
    `insert into outbox (id, table_name, row_id, op, payload, created_at, attempts, last_error)
     values (?, ?, ?, ?, ?, ?, 0, null)`,
    [clock.uuid(), table, id, op, JSON.stringify(payload), now],
  );
}

/** Inserts `fields` plus the sync columns, and queues the push. */
function insert(db: SqlRunner, table: string, ownerId: string, fields: Row, clock: Clock): string {
  const id = clock.uuid();
  const now = clock.now();
  const row: Row = {
    id,
    ...fields,
    owner_id: ownerId,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
  const columns = Object.keys(row);
  db.run(
    `insert into ${table} (${columns.join(', ')}) values (${columns.map(() => '?').join(', ')})`,
    Object.values(row),
  );
  queue(db, table, id, 'insert', row, clock, now);
  return id;
}

/** Sets `fields` on one row, bumps `updated_at`, and queues the push. */
function update(db: SqlRunner, table: string, id: string, fields: Row, clock: Clock): void {
  const now = clock.now();
  const changes: Row = { ...fields, updated_at: now };
  const sets = Object.keys(changes).map((column) => `${column} = ?`);
  db.run(`update ${table} set ${sets.join(', ')} where id = ?`, [...Object.values(changes), id]);
  queue(db, table, id, 'update', { id, ...changes }, clock, now);
}

function requirePositive(value: number, what: string) {
  if (!Number.isInteger(value) || value <= 0) {
    throw new WriteError('notPositive', `${what} must be a positive whole number.`);
  }
}

/** The owner's live row in `table`, or a `notFound` error. */
function own<T>(db: SqlReader, table: string, ownerId: string, id: string, columns = 'id'): T {
  const [row] = db.all<T>(
    `select ${columns} from ${table} where id = ? and owner_id = ? and deleted_at is null`,
    [id, ownerId],
  );
  if (!row) throw new WriteError('notFound', `No ${table} ${id} for this farmer.`);
  return row;
}

// --- Plots ----------------------------------------------------------------

export type NewPlot = {
  name: string;
  /** Square metres. Optional: many farmers do not know their area. */
  areaSqm?: number | null;
};

export function createPlot(db: SqlRunner, ownerId: string, plot: NewPlot, clock: Clock): string {
  const name = plot.name.trim();
  if (!name) throw new WriteError('required', 'A plot needs a name.');

  let id = '';
  db.transaction(() => {
    id = insert(
      db,
      'plot',
      ownerId,
      { name, area_sqm: plot.areaSqm ?? null, photo_uri: null },
      clock,
    );
  });
  return id;
}

// --- Plantings ------------------------------------------------------------

export type NewCycle = {
  plotId: string;
  cropId: string;
  /** 'YYYY-MM-DD' */
  plantedOn: string;
};

/** Starts a planting: a crop on a plot, from a date. */
export function createCycle(db: SqlDb, ownerId: string, cycle: NewCycle, clock: Clock): string {
  let id = '';
  db.transaction(() => {
    own(db, 'plot', ownerId, cycle.plotId);
    const [crop] = db.all<{ id: string }>('select id from crop where id = ?', [cycle.cropId]);
    if (!crop) throw new WriteError('notFound', `No crop ${cycle.cropId}.`);

    id = insert(
      db,
      'cycle',
      ownerId,
      {
        plot_id: cycle.plotId,
        crop_id: cycle.cropId,
        planted_on: cycle.plantedOn,
        expected_harvest_on: null,
        status: 'growing',
      },
      clock,
    );
  });
  return id;
}

/**
 * Ends a planting's season. Its money stays in the plot's history but leaves
 * "this season" on Home, which is what makes the next planting start at zero.
 */
export function closeCycle(db: SqlDb, ownerId: string, cycleId: string, clock: Clock): void {
  db.transaction(() => {
    own(db, 'cycle', ownerId, cycleId);
    update(db, 'cycle', cycleId, { status: 'closed' }, clock);
  });
}

// --- Records --------------------------------------------------------------

export type NewExpense = {
  cycleId: string;
  category: ExpenseCategory;
  amountCentavos: number;
  spentOn: string;
  note?: string | null;
};

export function recordExpense(
  db: SqlDb,
  ownerId: string,
  expense: NewExpense,
  clock: Clock,
): string {
  requirePositive(expense.amountCentavos, 'An expense');
  let id = '';
  db.transaction(() => {
    own(db, 'cycle', ownerId, expense.cycleId);
    id = insert(
      db,
      'expense',
      ownerId,
      {
        cycle_id: expense.cycleId,
        category: expense.category,
        amount_centavos: expense.amountCentavos,
        spent_on: expense.spentOn,
        note: expense.note?.trim() || null,
        photo_uri: null,
      },
      clock,
    );
  });
  return id;
}

export type NewHarvest = {
  cycleId: string;
  quantityMilli: number;
  unit: Unit;
  harvestedOn: string;
};

/**
 * Records produce picked. The first harvest moves a planting from "growing"
 * to "harvesting", so the Fields list says what is actually happening.
 */
export function recordHarvest(
  db: SqlDb,
  ownerId: string,
  harvest: NewHarvest,
  clock: Clock,
): string {
  requirePositive(harvest.quantityMilli, 'A harvest');
  let id = '';
  db.transaction(() => {
    const cycle = own<{ status: string }>(db, 'cycle', ownerId, harvest.cycleId, 'status');
    id = insert(
      db,
      'harvest',
      ownerId,
      {
        cycle_id: harvest.cycleId,
        quantity_milli: harvest.quantityMilli,
        unit: harvest.unit,
        harvested_on: harvest.harvestedOn,
        quality: null,
        photo_uri: null,
      },
      clock,
    );
    if (cycle.status === 'growing')
      update(db, 'cycle', harvest.cycleId, { status: 'harvested' }, clock);
  });
  return id;
}

export type NewSale = {
  harvestId: string;
  channel: SaleChannel;
  buyerName?: string | null;
  quantityMilli: number;
  unitPriceCentavos: number;
  soldOn: string;
};

/**
 * Records produce sold from one harvest. The total is computed here, once,
 * and stored; see `saleTotalCentavos`. Selling more than is left of the
 * harvest is refused, because it would put phantom money in the profit.
 */
export function recordSale(db: SqlDb, ownerId: string, sale: NewSale, clock: Clock): string {
  requirePositive(sale.quantityMilli, 'A sale quantity');
  requirePositive(sale.unitPriceCentavos, 'A price');
  let id = '';
  db.transaction(() => {
    const harvest = own<{ quantity_milli: number }>(
      db,
      'harvest',
      ownerId,
      sale.harvestId,
      'quantity_milli',
    );
    const [{ sold }] = db.all<{ sold: number }>(
      `select coalesce(sum(quantity_milli), 0) as sold from sale
       where harvest_id = ? and deleted_at is null`,
      [sale.harvestId],
    );
    if (sale.quantityMilli > harvest.quantity_milli - sold) {
      throw new WriteError('tooMuch', 'More than is left of this harvest.');
    }

    id = insert(
      db,
      'sale',
      ownerId,
      {
        harvest_id: sale.harvestId,
        channel: sale.channel,
        buyer_name: sale.buyerName?.trim() || null,
        quantity_milli: sale.quantityMilli,
        unit_price_centavos: sale.unitPriceCentavos,
        total_centavos: saleTotalCentavos(sale.quantityMilli, sale.unitPriceCentavos),
        sold_on: sale.soldOn,
      },
      clock,
    );
  });
  return id;
}
