import type { CycleStatus, ExpenseCategory, Unit } from './schema';
import { addMonths } from './units';
import type { SqlValue } from './write';

/**
 * Every screen reads through these functions. Like `write.ts`, they are plain
 * SQL against a tiny interface, so the same queries run on the device and in
 * the node:sqlite tests, and a screen test sees exactly what a farmer would.
 *
 * Every query is scoped to one owner and skips soft-deleted rows. A deleted
 * expense must vanish from every total at once, not only from the list.
 */

export interface SqlReader {
  all<T>(sql: string, params?: SqlValue[]): T[];
}

/** A crop's display name in both languages; screens pick one. */
export type CropName = { cropBis: string; cropEn: string };

export function cropName(row: CropName, language: 'bis' | 'en'): string {
  return language === 'bis' ? row.cropBis : row.cropEn;
}

// --- Season ---------------------------------------------------------------

export type SeasonTotals = {
  cycles: number;
  revenueCentavos: number;
  expenseCentavos: number;
  netCentavos: number;
};

/**
 * Earnings across every cycle that is not closed. "This season" to a farmer
 * is whatever is in the ground or waiting to be sold, which is exactly the set
 * of open cycles.
 */
export function seasonTotals(db: SqlReader, ownerId: string): SeasonTotals {
  const [row] = db.all<SeasonTotals>(
    `select
       count(*) as cycles,
       coalesce(sum(p.revenue_centavos), 0) as revenueCentavos,
       coalesce(sum(p.expense_centavos), 0) as expenseCentavos,
       coalesce(sum(p.net_centavos), 0) as netCentavos
     from cycle_pnl p
     join cycle c on c.id = p.cycle_id
     where c.owner_id = ? and c.deleted_at is null and c.status != 'closed'`,
    [ownerId],
  );
  return row;
}

export type MonthTotal = {
  /** 'YYYY-MM' */
  month: string;
  revenueCentavos: number;
  expenseCentavos: number;
  netCentavos: number;
};

/**
 * Money in and out per calendar month, oldest first, ending with the month of
 * `today`. Months with no records are present as zeros so a chart's spacing
 * matches the calendar.
 */
export function monthlyTotals(
  db: SqlReader,
  ownerId: string,
  today: string,
  months: number,
): MonthTotal[] {
  const first = addMonths(today, -(months - 1));
  const since = `${first}-01`;

  const sales = db.all<{ month: string; total: number }>(
    `select substr(s.sold_on, 1, 7) as month, sum(s.total_centavos) as total
     from sale s
     join harvest h on h.id = s.harvest_id
     where s.owner_id = ? and s.deleted_at is null and h.deleted_at is null and s.sold_on >= ?
     group by month`,
    [ownerId, since],
  );
  const expenses = db.all<{ month: string; total: number }>(
    `select substr(spent_on, 1, 7) as month, sum(amount_centavos) as total
     from expense
     where owner_id = ? and deleted_at is null and spent_on >= ?
     group by month`,
    [ownerId, since],
  );

  const revenue = new Map(sales.map((r) => [r.month, r.total]));
  const spent = new Map(expenses.map((r) => [r.month, r.total]));

  return Array.from({ length: months }, (_, i) => {
    const month = addMonths(first, i);
    const revenueCentavos = revenue.get(month) ?? 0;
    const expenseCentavos = spent.get(month) ?? 0;
    return {
      month,
      revenueCentavos,
      expenseCentavos,
      netCentavos: revenueCentavos - expenseCentavos,
    };
  });
}

/** Running balance, so the finance chart climbs while the farm earns. */
export function runningTotal(values: readonly number[]): number[] {
  let total = 0;
  return values.map((value) => (total += value));
}

// --- Plots and cycles -----------------------------------------------------

export type CycleSummary = CropName & {
  id: string;
  plotId: string;
  plotName: string;
  cropId: string;
  defaultUnit: Unit;
  cropIcon: string;
  plantedOn: string;
  expectedHarvestOn: string | null;
  status: CycleStatus;
  revenueCentavos: number;
  expenseCentavos: number;
  netCentavos: number;
};

/** Cycles newest first. Closed ones only when asked, for a plot's history. */
export function listCycles(
  db: SqlReader,
  ownerId: string,
  options: { plotId?: string; includeClosed?: boolean } = {},
): CycleSummary[] {
  const params: SqlValue[] = [ownerId];
  let filter = '';
  if (options.plotId) {
    filter += ' and c.plot_id = ?';
    params.push(options.plotId);
  }
  if (!options.includeClosed) filter += " and c.status != 'closed'";

  return db.all<CycleSummary>(
    `select
       c.id, c.plot_id as plotId, pl.name as plotName, c.crop_id as cropId,
       cr.default_unit as defaultUnit, c.planted_on as plantedOn,
       c.expected_harvest_on as expectedHarvestOn, c.status,
       cr.name_bis as cropBis, cr.name_en as cropEn, cr.icon as cropIcon,
       p.revenue_centavos as revenueCentavos, p.expense_centavos as expenseCentavos,
       p.net_centavos as netCentavos
     from cycle c
     join crop cr on cr.id = c.crop_id
     join plot pl on pl.id = c.plot_id
     join cycle_pnl p on p.cycle_id = c.id
     where c.owner_id = ? and c.deleted_at is null${filter}
     order by c.planted_on desc, c.created_at desc`,
    params,
  );
}

export type PlotSummary = {
  id: string;
  name: string;
  areaSqm: number | null;
  /** Open cycles only: what is on the land now. */
  cycles: CycleSummary[];
  netCentavos: number;
};

export function listPlots(db: SqlReader, ownerId: string): PlotSummary[] {
  const plots = db.all<{ id: string; name: string; areaSqm: number | null }>(
    `select id, name, area_sqm as areaSqm
     from plot
     where owner_id = ? and deleted_at is null
     order by created_at, name`,
    [ownerId],
  );
  const cycles = listCycles(db, ownerId);

  return plots.map((plot) => {
    const own = cycles.filter((c) => c.plotId === plot.id);
    return {
      ...plot,
      cycles: own,
      netCentavos: own.reduce((sum, c) => sum + c.netCentavos, 0),
    };
  });
}

export function getPlot(db: SqlReader, ownerId: string, plotId: string) {
  const [plot] = db.all<{ id: string; name: string; areaSqm: number | null }>(
    `select id, name, area_sqm as areaSqm
     from plot
     where owner_id = ? and id = ? and deleted_at is null`,
    [ownerId, plotId],
  );
  return plot ?? null;
}

export type CropOption = CropName & { id: string; icon: string; defaultUnit: Unit };

/** The crop list in its display order, for the planting form. */
export function listCrops(db: SqlReader): CropOption[] {
  return db.all<CropOption>(
    `select id, name_bis as cropBis, name_en as cropEn, icon, default_unit as defaultUnit
     from crop order by sort_order, name_en`,
  );
}

// --- Ledger ---------------------------------------------------------------

export type LedgerKind = 'expense' | 'harvest' | 'sale';

export type LedgerEntry = CropName & {
  kind: LedgerKind;
  id: string;
  /** 'YYYY-MM-DD' */
  date: string;
  /** Money out for an expense, money in for a sale, null for a harvest. */
  amountCentavos: number | null;
  quantityMilli: number | null;
  unit: Unit | null;
  category: ExpenseCategory | null;
  plotName: string;
};

/**
 * Every expense, harvest and sale as one timeline, newest first. The Activity
 * tab is this list; Home shows its first few rows.
 */
export function ledger(
  db: SqlReader,
  ownerId: string,
  options: { from?: string; to?: string; kind?: LedgerKind; limit?: number } = {},
): LedgerEntry[] {
  const where: string[] = ['owner_id = ?'];
  const params: SqlValue[] = [ownerId];
  if (options.from) {
    where.push('date >= ?');
    params.push(options.from);
  }
  if (options.to) {
    where.push('date <= ?');
    params.push(options.to);
  }
  if (options.kind) {
    where.push('kind = ?');
    params.push(options.kind);
  }
  params.push(options.limit ?? -1);

  return db.all<LedgerEntry>(
    `select kind, id, date, amountCentavos, quantityMilli, unit, category,
            cropBis, cropEn, plotName
     from (
       select 'expense' as kind, e.id, e.spent_on as date, e.amount_centavos as amountCentavos,
              null as quantityMilli, null as unit, e.category, e.owner_id, e.created_at,
              cr.name_bis as cropBis, cr.name_en as cropEn, p.name as plotName
       from expense e
       join cycle c on c.id = e.cycle_id
       join crop cr on cr.id = c.crop_id
       join plot p on p.id = c.plot_id
       where e.deleted_at is null
       union all
       select 'harvest', h.id, h.harvested_on, null, h.quantity_milli, h.unit, null,
              h.owner_id, h.created_at, cr.name_bis, cr.name_en, p.name
       from harvest h
       join cycle c on c.id = h.cycle_id
       join crop cr on cr.id = c.crop_id
       join plot p on p.id = c.plot_id
       where h.deleted_at is null
       union all
       select 'sale', s.id, s.sold_on, s.total_centavos, s.quantity_milli, h.unit, null,
              s.owner_id, s.created_at, cr.name_bis, cr.name_en, p.name
       from sale s
       join harvest h on h.id = s.harvest_id
       join cycle c on c.id = h.cycle_id
       join crop cr on cr.id = c.crop_id
       join plot p on p.id = c.plot_id
       where s.deleted_at is null and h.deleted_at is null
     )
     where ${where.join(' and ')}
     order by date desc, created_at desc
     limit ?`,
    params,
  );
}

// --- Produce on hand ------------------------------------------------------

export type UnsoldHarvest = CropName & {
  id: string;
  harvestedOn: string;
  remainingMilli: number;
  unit: Unit;
  shelfLifeDays: number;
  plotName: string;
};

/** Harvests with produce not yet sold. The spoilage countdown reads this. */
export function unsoldHarvests(db: SqlReader, ownerId: string): UnsoldHarvest[] {
  return db.all<UnsoldHarvest>(
    `select * from (
       select h.id, h.harvested_on as harvestedOn, h.unit,
              h.quantity_milli - coalesce((
                select sum(s.quantity_milli) from sale s
                where s.harvest_id = h.id and s.deleted_at is null
              ), 0) as remainingMilli,
              cr.name_bis as cropBis, cr.name_en as cropEn,
              cr.shelf_life_days as shelfLifeDays, p.name as plotName
       from harvest h
       join cycle c on c.id = h.cycle_id
       join crop cr on cr.id = c.crop_id
       join plot p on p.id = c.plot_id
       where h.owner_id = ? and h.deleted_at is null
     )
     where remainingMilli > 0
     order by harvestedOn, id`,
    [ownerId],
  );
}

// --- Statistics -----------------------------------------------------------

export type FarmCounts = {
  plots: number;
  /** Null when no plot has a known area. */
  areaSqm: number | null;
  growingCycles: number;
  /** Records saved on the phone and not yet sent to the server. */
  pendingSync: number;
};

export function farmCounts(db: SqlReader, ownerId: string): FarmCounts {
  const [row] = db.all<FarmCounts>(
    `select
       (select count(*) from plot where owner_id = ? and deleted_at is null) as plots,
       (select sum(area_sqm) from plot where owner_id = ? and deleted_at is null) as areaSqm,
       (select count(*) from cycle
          where owner_id = ? and deleted_at is null and status = 'growing') as growingCycles,
       (select count(*) from outbox) as pendingSync`,
    [ownerId, ownerId, ownerId],
  );
  return row;
}

/** Season spending per category, largest first. */
export function expensesByCategory(db: SqlReader, ownerId: string) {
  return db.all<{ category: ExpenseCategory; amountCentavos: number }>(
    `select e.category, sum(e.amount_centavos) as amountCentavos
     from expense e
     join cycle c on c.id = e.cycle_id
     where e.owner_id = ? and e.deleted_at is null
       and c.deleted_at is null and c.status != 'closed'
     group by e.category
     order by amountCentavos desc`,
    [ownerId],
  );
}

/** Season harvest per crop and unit, largest first. */
export function harvestByCrop(db: SqlReader, ownerId: string) {
  return db.all<CropName & { cropId: string; unit: Unit; quantityMilli: number }>(
    `select cr.id as cropId, cr.name_bis as cropBis, cr.name_en as cropEn, h.unit,
            sum(h.quantity_milli) as quantityMilli
     from harvest h
     join cycle c on c.id = h.cycle_id
     join crop cr on cr.id = c.crop_id
     where h.owner_id = ? and h.deleted_at is null
       and c.deleted_at is null and c.status != 'closed'
     group by cr.id, h.unit
     order by quantityMilli desc`,
    [ownerId],
  );
}

/**
 * What the farmer has been getting per unit for each crop, weighted by
 * quantity, over the last `days`. For the assistant's "when and where to
 * sell" answers; one row per crop and unit.
 */
export function salePrices(db: SqlReader, ownerId: string, since: string) {
  return db.all<CropName & { unit: Unit; sales: number; avgCentavos: number }>(
    `select cr.name_bis as cropBis, cr.name_en as cropEn, h.unit,
            count(*) as sales,
            cast(round(sum(s.total_centavos) * 1000.0 / sum(s.quantity_milli)) as integer) as avgCentavos
     from sale s
     join harvest h on h.id = s.harvest_id
     join cycle c on c.id = h.cycle_id
     join crop cr on cr.id = c.crop_id
     where s.owner_id = ? and s.deleted_at is null and h.deleted_at is null and s.sold_on >= ?
     group by cr.id, h.unit
     order by sales desc`,
    [ownerId, since],
  );
}
