import { openTestDb, type TestDb } from './testing/openTestDb';
import { createPlot, type SqlRunner } from './write';

/** The node:sqlite equivalent of the device runner in `client.ts`. */
function runnerFor(db: TestDb): SqlRunner {
  return {
    run: (sql, params) => void db.prepare(sql).run(...params),
    transaction: (work) => {
      db.exec('begin');
      try {
        work();
        db.exec('commit');
      } catch (error) {
        db.exec('rollback');
        throw error;
      }
    },
  };
}

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
