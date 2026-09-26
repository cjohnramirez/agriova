import { openTestDb, runnerFor, seedCrops, type TestDb } from './testing/openTestDb';
import {
  closeCycle,
  createCycle,
  createPlot,
  recordExpense,
  recordHarvest,
  recordSale,
} from './write';

let n = 0;
const clock = { now: () => 1_700_000_000_000, uuid: () => `id-${++n}` };

let db: TestDb;
beforeEach(() => {
  n = 0;
  db = openTestDb();
});
afterEach(() => db.close());

describe('createPlot', () => {
  it('writes the plot and queues exactly one push for it', () => {
    const id = createPlot(
      runnerFor(db),
      'owner-1',
      { name: '  Luna sa Gusa ', areaSqm: 2500 },
      clock,
    );

    expect(db.prepare('select name, area_sqm, owner_id from plot where id = ?').get(id)).toEqual({
      name: 'Luna sa Gusa',
      area_sqm: 2500,
      owner_id: 'owner-1',
    });
    const queued = db.prepare('select table_name, row_id, op, payload from outbox').all();
    expect(queued).toHaveLength(1);
    expect(queued[0]).toMatchObject({ table_name: 'plot', row_id: id, op: 'insert' });
    expect(JSON.parse(String(queued[0].payload))).toMatchObject({ id, name: 'Luna sa Gusa' });
  });

  it('allows an unknown area', () => {
    const id = createPlot(runnerFor(db), 'owner-1', { name: 'Uma' }, clock);
    expect(db.prepare('select area_sqm from plot where id = ?').get(id)).toEqual({
      area_sqm: null,
    });
  });

  it('refuses a blank name', () =>
    expect(() => createPlot(runnerFor(db), 'o', { name: '   ' }, clock)).toThrow());

  // The core guarantee: a failed write leaves neither the row nor its outbox entry.
  it('writes nothing when the plot is rejected', () => {
    expect(() => createPlot(runnerFor(db), 'o', { name: 'Wala', areaSqm: 0 }, clock)).toThrow();
    expect(db.prepare('select count(*) as n from plot').get()).toEqual({ n: 0 });
    expect(db.prepare('select count(*) as n from outbox').get()).toEqual({ n: 0 });
  });
});

describe('recording a season', () => {
  const OWNER = 'owner-1';
  let plotId: string;
  let cycleId: string;

  beforeEach(() => {
    seedCrops(db);
    plotId = createPlot(runnerFor(db), OWNER, { name: 'Uma' }, clock);
    cycleId = createCycle(
      runnerFor(db),
      OWNER,
      { plotId, cropId: 'crop-tomato', plantedOn: '2026-06-01' },
      clock,
    );
  });

  const pnl = () =>
    db.prepare('select revenue_centavos, expense_centavos, net_centavos from cycle_pnl').get();
  const outboxOps = () =>
    db
      .prepare('select table_name, op from outbox order by created_at, rowid')
      .all()
      .map((r) => `${r.table_name}:${r.op}`);

  it('carries an expense, harvest and sale through to profit, each queued for sync', () => {
    recordExpense(
      runnerFor(db),
      OWNER,
      { cycleId, category: 'fertilizer', amountCentavos: 150_000, spentOn: '2026-06-10' },
      clock,
    );
    const harvestId = recordHarvest(
      runnerFor(db),
      OWNER,
      { cycleId, quantityMilli: 100_000, unit: 'kg', harvestedOn: '2026-08-01' },
      clock,
    );
    recordSale(
      runnerFor(db),
      OWNER,
      {
        harvestId,
        channel: 'direct',
        quantityMilli: 40_500,
        unitPriceCentavos: 3_333,
        soldOn: '2026-08-02',
      },
      clock,
    );

    // 40.5 kg at ₱33.33 is ₱1,349.865, rounded once to ₱1,349.87.
    expect(pnl()).toEqual({
      revenue_centavos: 134_987,
      expense_centavos: 150_000,
      net_centavos: -15_013,
    });
    expect(outboxOps()).toEqual([
      'plot:insert',
      'cycle:insert',
      'expense:insert',
      'harvest:insert',
      'cycle:update',
      'sale:insert',
    ]);
  });

  it('moves a planting to harvesting on its first harvest', () => {
    recordHarvest(
      runnerFor(db),
      OWNER,
      { cycleId, quantityMilli: 1_000, unit: 'kg', harvestedOn: '2026-08-01' },
      clock,
    );
    expect(db.prepare('select status from cycle').get()).toEqual({ status: 'harvested' });
  });

  it('refuses to sell more than is left of a harvest', () => {
    const harvestId = recordHarvest(
      runnerFor(db),
      OWNER,
      { cycleId, quantityMilli: 10_000, unit: 'kg', harvestedOn: '2026-08-01' },
      clock,
    );
    const sell = (quantityMilli: number) =>
      recordSale(
        runnerFor(db),
        OWNER,
        {
          harvestId,
          channel: 'middleman',
          quantityMilli,
          unitPriceCentavos: 4_000,
          soldOn: '2026-08-02',
        },
        clock,
      );
    sell(6_000);
    expect(() => sell(4_001)).toThrow(expect.objectContaining({ code: 'tooMuch' }));
    expect(() => sell(4_000)).not.toThrow();
  });

  it('will not attach a record to another farmer’s planting', () => {
    expect(() =>
      recordExpense(
        runnerFor(db),
        'owner-2',
        { cycleId, category: 'seed', amountCentavos: 100, spentOn: '2026-06-01' },
        clock,
      ),
    ).toThrow(expect.objectContaining({ code: 'notFound' }));
    expect(db.prepare('select count(*) as n from expense').get()).toEqual({ n: 0 });
  });

  it('refuses a zero expense', () =>
    expect(() =>
      recordExpense(
        runnerFor(db),
        OWNER,
        { cycleId, category: 'seed', amountCentavos: 0, spentOn: '2026-06-01' },
        clock,
      ),
    ).toThrow(expect.objectContaining({ code: 'notPositive' })));

  it('closes a planting out of the season', () => {
    closeCycle(runnerFor(db), OWNER, cycleId, clock);
    expect(db.prepare('select status from cycle').get()).toEqual({ status: 'closed' });
    expect(outboxOps().at(-1)).toBe('cycle:update');
  });
});
