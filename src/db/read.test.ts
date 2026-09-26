import { seedDemoFarm } from './demo';
import {
  expensesByCategory,
  farmCounts,
  getPlot,
  harvestByCrop,
  ledger,
  listCycles,
  listPlots,
  monthlyTotals,
  runningTotal,
  seasonTotals,
  unsoldHarvests,
  type SqlReader,
} from './read';
import { openTestDb, readerFor, runnerFor, seedCrops, type TestDb } from './testing/openTestDb';
import { createPlot } from './write';

const TODAY = '2026-09-26';
const OWNER = 'owner-1';

let db: TestDb;
let read: SqlReader;
let n: number;
const uuid = () => `id-${++n}`;

beforeEach(() => {
  n = 0;
  db = openTestDb();
  seedCrops(db);
  read = readerFor(db);
  seedDemoFarm(runnerFor(db), OWNER, TODAY, uuid, 1_700_000_000_000);
});
afterEach(() => db.close());

describe('seasonTotals', () => {
  // Tomato and corn are open; the closed eggplant cycle's ₱600 seed is last season.
  it('sums open cycles only', () =>
    expect(seasonTotals(read, OWNER)).toEqual({
      cycles: 2,
      revenueCentavos: 1_251_000,
      expenseCentavos: 1_198_000,
      netCentavos: 53_000,
    }));

  it('is zero for a farmer with no records', () =>
    expect(seasonTotals(read, 'someone-else')).toEqual({
      cycles: 0,
      revenueCentavos: 0,
      expenseCentavos: 0,
      netCentavos: 0,
    }));

  it('drops a soft-deleted expense from the total at once', () => {
    db.exec(`update expense set deleted_at = 1 where category = 'transport'`);
    expect(seasonTotals(read, OWNER).expenseCentavos).toBe(1_198_000 - 35_000);
  });

  it('never shows another farmer’s money', () => {
    seedDemoFarm(runnerFor(db), 'owner-2', TODAY, uuid);
    expect(seasonTotals(read, OWNER).netCentavos).toBe(53_000);
  });
});

describe('monthlyTotals', () => {
  it('returns every month in order, with empty months as zero', () => {
    const months = monthlyTotals(read, OWNER, TODAY, 6);
    expect(months.map((m) => m.month)).toEqual([
      '2026-04',
      '2026-05',
      '2026-06',
      '2026-07',
      '2026-08',
      '2026-09',
    ]);
    expect(months[0]).toEqual({
      month: '2026-04',
      revenueCentavos: 0,
      expenseCentavos: 0,
      netCentavos: 0,
    });
  });

  it('nets sales against spending in the month they happened', () => {
    const september = monthlyTotals(read, OWNER, TODAY, 6).at(-1);
    // Sales on Sep 8, 9 and 23; labor on Sep 6 and transport on Sep 25.
    expect(september).toEqual({
      month: '2026-09',
      revenueCentavos: 405_000 + 240_000 + 150_000,
      expenseCentavos: 180_000 + 35_000,
      netCentavos: 795_000 - 215_000,
    });
  });

  it('agrees with the season total over the season’s months', () => {
    const net = monthlyTotals(read, OWNER, TODAY, 5).reduce((s, m) => s + m.netCentavos, 0);
    expect(net).toBe(53_000);
  });

  it('accumulates into a running balance', () =>
    expect(runningTotal([5, -2, 0, 4])).toEqual([5, 3, 3, 7]));
});

describe('plots and cycles', () => {
  it('lists plots with what is growing on them', () => {
    const plots = listPlots(read, OWNER);
    expect(plots.map((p) => [p.name, p.areaSqm, p.cycles.map((c) => c.cropEn)])).toEqual([
      ['Duol sa suba', 2500, ['Tomato']],
      ['Luna sa bungtod', 8000, ['Corn']],
    ]);
    expect(plots[1].netCentavos).toBe(-610_000);
  });

  it('includes a plot with nothing planted', () => {
    createPlot(runnerFor(db), OWNER, { name: 'Bag-o' }, { now: () => 2e12, uuid });
    const empty = listPlots(read, OWNER).at(-1);
    expect(empty).toMatchObject({ name: 'Bag-o', areaSqm: null, cycles: [], netCentavos: 0 });
  });

  it('shows a plot’s closed cycles only in its history', () => {
    const river = listPlots(read, OWNER)[0].id;
    expect(listCycles(read, OWNER, { plotId: river }).map((c) => c.cropEn)).toEqual(['Tomato']);
    expect(
      listCycles(read, OWNER, { plotId: river, includeClosed: true }).map((c) => [
        c.cropEn,
        c.status,
        c.netCentavos,
      ]),
    ).toEqual([
      ['Tomato', 'harvested', 1_251_000 - 588_000],
      ['Eggplant', 'closed', -60_000],
    ]);
  });

  it('will not open another farmer’s plot', () => {
    const river = listPlots(read, OWNER)[0].id;
    expect(getPlot(read, OWNER, river)?.name).toBe('Duol sa suba');
    expect(getPlot(read, 'owner-2', river)).toBeNull();
  });
});

describe('ledger', () => {
  it('merges the three record types newest first', () => {
    const recent = ledger(read, OWNER, { limit: 3 });
    expect(recent.map((e) => [e.kind, e.date, e.amountCentavos])).toEqual([
      ['expense', '2026-09-25', 35_000],
      ['sale', '2026-09-23', 150_000],
      ['harvest', '2026-09-21', null],
    ]);
    expect(recent[2]).toMatchObject({
      quantityMilli: 80_000,
      unit: 'kg',
      cropBis: 'Kamatis',
      plotName: 'Duol sa suba',
    });
  });

  it('filters to a day and a kind', () => {
    expect(ledger(read, OWNER, { from: '2026-09-25', to: '2026-09-25' })).toHaveLength(1);
    expect(ledger(read, OWNER, { kind: 'sale' }).map((e) => e.date)).toEqual([
      '2026-09-23',
      '2026-09-09',
      '2026-09-08',
      '2026-08-13',
    ]);
  });
});

describe('unsoldHarvests', () => {
  it('reports what is left after sales', () => {
    expect(unsoldHarvests(read, OWNER).map((h) => [h.harvestedOn, h.remainingMilli])).toEqual([
      ['2026-09-21', 50_000],
    ]);
  });

  it('forgets a harvest once it is all sold', () => {
    db.exec(`update harvest set quantity_milli = 30000 where harvested_on = '2026-09-21'`);
    expect(unsoldHarvests(read, OWNER)).toEqual([]);
  });
});

describe('statistics', () => {
  it('counts the farm', () =>
    expect(farmCounts(read, OWNER)).toEqual({
      plots: 2,
      areaSqm: 10_500,
      growingCycles: 1,
      pendingSync: 0,
    }));

  it('groups the season’s spending by category, largest first', () =>
    expect(expensesByCategory(read, OWNER).slice(0, 2)).toEqual([
      { category: 'fertilizer', amountCentavos: 550_000 },
      { category: 'labor', amountCentavos: 330_000 },
    ]));

  it('totals the season’s harvest by crop', () =>
    expect(harvestByCrop(read, OWNER)).toEqual([
      {
        cropId: 'crop-tomato',
        cropBis: 'Kamatis',
        cropEn: 'Tomato',
        unit: 'kg',
        quantityMilli: 350_000,
      },
    ]));
});
