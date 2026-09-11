import { sql } from 'drizzle-orm';
import { check, index, integer, sqliteTable, sqliteView, text } from 'drizzle-orm/sqlite-core';

/**
 * Local SQLite schema. This is the source of truth for everything the farmer
 * authors; Supabase Postgres mirrors it column for column so that sync is a
 * straight copy rather than a translation.
 *
 * Five conventions hold everywhere and exist for specific reasons:
 *
 * 1. Primary keys are client-generated UUID text. A record must be valid and
 *    referenceable before it has ever reached a server, because it is created
 *    offline in a field.
 *
 * 2. Money is integer centavos. Never a float. The farmer's trust in this app
 *    dies the first time a total is off by a peso.
 *
 * 3. Quantities are integer thousandths of their unit, because a quantity gets
 *    multiplied by a price and a float quantity would infect the money path.
 *    12.5 kg is stored as 12500 with unit 'kg'.
 *
 * 4. Calendar dates are TEXT in 'YYYY-MM-DD'. Instants are integer Unix
 *    milliseconds. Keeping them apart matters: a farmer tapping "today" in the
 *    Philippines must not land on yesterday because of a UTC conversion.
 *
 * 5. Enum and range columns carry a CHECK constraint as well as a TypeScript
 *    union. The union protects code in this app; the constraint protects
 *    against a malformed row arriving from a server pull, which never passes
 *    through TypeScript at all.
 */

const UNITS = ['kg', 'sack', 'piece', 'bundle'] as const;
const EXPENSE_CATEGORIES = [
  'seed',
  'fertilizer',
  'pesticide',
  'labor',
  'fuel',
  'transport',
  'rent',
  'other',
] as const;
const CYCLE_STATUSES = ['growing', 'harvested', 'closed'] as const;
const SALE_CHANNELS = ['marketplace', 'middleman', 'direct'] as const;
const QUALITIES = ['good', 'fair', 'poor'] as const;
const OUTBOX_OPS = ['insert', 'update', 'delete'] as const;

/** Builds a CHECK expression pinning a column to a fixed set of values. */
function oneOf(column: string, values: readonly string[]) {
  const list = values.map((value) => `'${value}'`).join(', ');
  return sql.raw(`"${column}" in (${list})`);
}

/** Builds a CHECK expression from a raw SQL predicate. */
function predicate(expression: string) {
  return sql.raw(expression);
}

/** Columns every syncing table carries. Spread into each table definition. */
const syncColumns = {
  /** Supabase auth user id. Mirrors the Postgres `owner_id = auth.uid()` policy. */
  ownerId: text('owner_id').notNull(),
  createdAt: integer('created_at').notNull(),
  updatedAt: integer('updated_at').notNull(),
  /** Soft delete, so a deletion can sync. Null means live. */
  deletedAt: integer('deleted_at'),
};

// --- Reference data, pulled from the server -------------------------------

/**
 * Crops the app knows about. Seeded locally so a brand new install works with
 * no connection, then refreshed from the server.
 *
 * `shelfLifeDays` drives the spoilage alert and is the whole reason this is a
 * table rather than a free-text crop name on each cycle.
 */
export const crop = sqliteTable(
  'crop',
  {
    id: text('id').primaryKey(),
    nameBis: text('name_bis').notNull(),
    nameEn: text('name_en').notNull(),
    /** Lucide icon name, so the entry grid renders without bundled art. */
    icon: text('icon').notNull(),
    shelfLifeDays: integer('shelf_life_days').notNull(),
    defaultUnit: text('default_unit', { enum: UNITS }).notNull(),
    sortOrder: integer('sort_order').notNull().default(0),
    updatedAt: integer('updated_at').notNull(),
  },
  () => [
    check('crop_unit_check', oneOf('default_unit', UNITS)),
    check('crop_shelf_life_check', predicate('"shelf_life_days" > 0')),
  ],
);

/**
 * Observed market prices, cached from the server. Drives the warning shown when
 * a farmer records a sale below the going rate, which is the feature the fruit
 * vendor interviews asked for most directly.
 */
export const priceReference = sqliteTable(
  'price_reference',
  {
    id: text('id').primaryKey(),
    cropId: text('crop_id')
      .notNull()
      .references(() => crop.id),
    /** Barangay or city code. The pilot is Cagayan de Oro. */
    areaCode: text('area_code').notNull(),
    observedOn: text('observed_on').notNull(),
    lowCentavos: integer('low_centavos').notNull(),
    medianCentavos: integer('median_centavos').notNull(),
    highCentavos: integer('high_centavos').notNull(),
    unit: text('unit', { enum: UNITS }).notNull(),
    updatedAt: integer('updated_at').notNull(),
  },
  (table) => [
    index('price_reference_crop_area_idx').on(table.cropId, table.areaCode),
    check('price_reference_unit_check', oneOf('unit', UNITS)),
    check(
      'price_reference_order_check',
      predicate('"low_centavos" <= "median_centavos" and "median_centavos" <= "high_centavos"'),
    ),
  ],
);

// --- Farmer-authored data -------------------------------------------------

/** A piece of land. A smallholder typically has one or two. */
export const plot = sqliteTable(
  'plot',
  {
    id: text('id').primaryKey(),
    name: text('name').notNull(),
    /** Square metres. One hectare is 10,000. */
    areaSqm: integer('area_sqm'),
    photoUri: text('photo_uri'),
    ...syncColumns,
  },
  (table) => [
    index('plot_owner_idx').on(table.ownerId),
    check('plot_area_check', predicate('"area_sqm" is null or "area_sqm" > 0')),
  ],
);

/**
 * One planting through to its close. Every expense, harvest and sale hangs off
 * a cycle, which is what makes a per-season profit figure possible at all.
 */
export const cycle = sqliteTable(
  'cycle',
  {
    id: text('id').primaryKey(),
    plotId: text('plot_id')
      .notNull()
      .references(() => plot.id),
    cropId: text('crop_id')
      .notNull()
      .references(() => crop.id),
    plantedOn: text('planted_on').notNull(),
    expectedHarvestOn: text('expected_harvest_on'),
    status: text('status', { enum: CYCLE_STATUSES }).notNull().default('growing'),
    ...syncColumns,
  },
  (table) => [
    index('cycle_plot_idx').on(table.plotId),
    index('cycle_owner_status_idx').on(table.ownerId, table.status),
    check('cycle_status_check', oneOf('status', CYCLE_STATUSES)),
  ],
);

/** Money spent on a cycle. Category is a fixed list so it can be a photo grid. */
export const expense = sqliteTable(
  'expense',
  {
    id: text('id').primaryKey(),
    cycleId: text('cycle_id')
      .notNull()
      .references(() => cycle.id),
    category: text('category', { enum: EXPENSE_CATEGORIES }).notNull(),
    amountCentavos: integer('amount_centavos').notNull(),
    spentOn: text('spent_on').notNull(),
    note: text('note'),
    photoUri: text('photo_uri'),
    ...syncColumns,
  },
  (table) => [
    index('expense_cycle_idx').on(table.cycleId),
    check('expense_category_check', oneOf('category', EXPENSE_CATEGORIES)),
    check('expense_amount_check', predicate('"amount_centavos" >= 0')),
  ],
);

/** Produce taken off a cycle. Spoilage alerts are scheduled from `harvestedOn`. */
export const harvest = sqliteTable(
  'harvest',
  {
    id: text('id').primaryKey(),
    cycleId: text('cycle_id')
      .notNull()
      .references(() => cycle.id),
    /** Thousandths of `unit`. See the quantity convention at the top. */
    quantityMilli: integer('quantity_milli').notNull(),
    unit: text('unit', { enum: UNITS }).notNull(),
    harvestedOn: text('harvested_on').notNull(),
    quality: text('quality', { enum: QUALITIES }),
    photoUri: text('photo_uri'),
    ...syncColumns,
  },
  (table) => [
    index('harvest_cycle_idx').on(table.cycleId),
    check('harvest_unit_check', oneOf('unit', UNITS)),
    check('harvest_quality_check', predicate('"quality" is null or "quality" in (\'good\', \'fair\', \'poor\')')),
    check('harvest_quantity_check', predicate('"quantity_milli" > 0')),
  ],
);

/**
 * Produce sold. `channel` deliberately keeps `middleman` as an option: farmers
 * will not stop using middlemen overnight, and excluding those sales would make
 * the profit figure wrong, which is worse than an unflattering statistic.
 *
 * `totalCentavos` is authoritative rather than derived. The farmer agreed a
 * total with a buyer, and recomputing it from quantity times unit price would
 * reintroduce rounding drift on every read.
 */
export const sale = sqliteTable(
  'sale',
  {
    id: text('id').primaryKey(),
    harvestId: text('harvest_id')
      .notNull()
      .references(() => harvest.id),
    channel: text('channel', { enum: SALE_CHANNELS }).notNull(),
    buyerName: text('buyer_name'),
    quantityMilli: integer('quantity_milli').notNull(),
    unitPriceCentavos: integer('unit_price_centavos').notNull(),
    totalCentavos: integer('total_centavos').notNull(),
    soldOn: text('sold_on').notNull(),
    ...syncColumns,
  },
  (table) => [
    index('sale_harvest_idx').on(table.harvestId),
    check('sale_channel_check', oneOf('channel', SALE_CHANNELS)),
    check('sale_quantity_check', predicate('"quantity_milli" > 0')),
    check('sale_amounts_check', predicate('"unit_price_centavos" >= 0 and "total_centavos" >= 0')),
  ],
);

// --- Sync plumbing --------------------------------------------------------

/**
 * Pending writes waiting for a connection. A row and its outbox entry are
 * inserted in one transaction, so a record can never exist locally without a
 * pending push.
 */
export const outbox = sqliteTable(
  'outbox',
  {
    id: text('id').primaryKey(),
    tableName: text('table_name').notNull(),
    rowId: text('row_id').notNull(),
    op: text('op', { enum: OUTBOX_OPS }).notNull(),
    payload: text('payload', { mode: 'json' }).notNull(),
    createdAt: integer('created_at').notNull(),
    attempts: integer('attempts').notNull().default(0),
    lastError: text('last_error'),
  },
  (table) => [
    index('outbox_created_idx').on(table.createdAt),
    check('outbox_op_check', oneOf('op', OUTBOX_OPS)),
  ],
);

/** Per-table high water mark for incremental pulls. */
export const syncState = sqliteTable('sync_state', {
  tableName: text('table_name').primaryKey(),
  lastPulledAt: integer('last_pulled_at').notNull().default(0),
});

// --- Derived ---------------------------------------------------------------

/**
 * Profit per cycle, as a view rather than stored columns. A stored total would
 * drift from its inputs the moment a write path forgot to update it; a view
 * cannot drift by construction.
 *
 * Soft-deleted rows are excluded at every level, so removing an expense
 * immediately corrects the figure the farmer sees on the home screen.
 */
export const cyclePnl = sqliteView('cycle_pnl').as((qb) =>
  qb
    .select({
      cycleId: sql<string>`c.id`.as('cycle_id'),
      ownerId: sql<string>`c.owner_id`.as('owner_id'),
      revenueCentavos: sql<number>`coalesce((
        select sum(s.total_centavos) from sale s
        join harvest h on h.id = s.harvest_id
        where h.cycle_id = c.id and s.deleted_at is null and h.deleted_at is null
      ), 0)`.as('revenue_centavos'),
      expenseCentavos: sql<number>`coalesce((
        select sum(e.amount_centavos) from expense e
        where e.cycle_id = c.id and e.deleted_at is null
      ), 0)`.as('expense_centavos'),
      netCentavos: sql<number>`coalesce((
        select sum(s.total_centavos) from sale s
        join harvest h on h.id = s.harvest_id
        where h.cycle_id = c.id and s.deleted_at is null and h.deleted_at is null
      ), 0) - coalesce((
        select sum(e.amount_centavos) from expense e
        where e.cycle_id = c.id and e.deleted_at is null
      ), 0)`.as('net_centavos'),
    })
    .from(sql`cycle c`),
);

export type Unit = (typeof UNITS)[number];
export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];
export type CycleStatus = (typeof CYCLE_STATUSES)[number];
export type SaleChannel = (typeof SALE_CHANNELS)[number];

export type Crop = typeof crop.$inferSelect;
export type Plot = typeof plot.$inferSelect;
export type Cycle = typeof cycle.$inferSelect;
export type Expense = typeof expense.$inferSelect;
export type Harvest = typeof harvest.$inferSelect;
export type Sale = typeof sale.$inferSelect;
export type OutboxEntry = typeof outbox.$inferSelect;
export type CyclePnl = typeof cyclePnl.$inferSelect;
