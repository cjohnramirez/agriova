import { seedDemoFarm } from '@/db/demo';
import { openTestDb, runnerFor, seedCrops, type TestDb } from '@/db/testing/openTestDb';
import { createPlot, recordExpense, type SqlDb } from '@/db/write';

import {
  pull,
  push,
  syncOnce,
  type PullTable,
  type PushTable,
  type Remote,
  type Row,
} from './engine';

const OWNER = 'owner-1';
const PARENT: Partial<Record<PushTable, [string, PushTable]>> = {
  cycle: ['plot_id', 'plot'],
  expense: ['cycle_id', 'cycle'],
  harvest: ['cycle_id', 'cycle'],
  sale: ['harvest_id', 'harvest'],
};

/**
 * An in-memory server with the rules of the real one: last write wins on
 * updated_at, synced_at from its own clock, and a child refused until its
 * parent exists.
 */
class FakeServer implements Remote {
  tables = new Map<string, Map<string, Row>>();
  clock = 0;
  failOn: PushTable | null = null;
  upserts: PushTable[] = [];

  table(name: string) {
    if (!this.tables.has(name)) this.tables.set(name, new Map());
    return this.tables.get(name)!;
  }

  async upsert(table: PushTable, rows: Row[]) {
    if (this.failOn === table) throw new Error('offline');
    this.upserts.push(table);
    const parent = PARENT[table];
    for (const row of rows) {
      if (parent && !this.table(parent[1]).has(String(row[parent[0]]))) {
        throw new Error(`foreign key: ${table} before its ${parent[1]}`);
      }
      const existing = this.table(table).get(String(row.id));
      if (existing && Number(row.updated_at) < Number(existing.updated_at)) continue;
      this.table(table).set(String(row.id), { ...row, synced_at: ++this.clock });
    }
  }

  async pull(table: PullTable, since: number, limit: number) {
    return [...this.table(table).values()]
      .filter((r) => Number(r.synced_at) > since)
      .sort((a, b) => Number(a.synced_at) - Number(b.synced_at))
      .slice(0, limit);
  }
}

let n = 0;
const clock = (now: () => number) => ({ now, uuid: () => `id-${++n}` });

function phone(): { raw: TestDb; db: SqlDb } {
  const raw = openTestDb();
  seedCrops(raw);
  return { raw, db: runnerFor(raw) };
}

const count = (raw: TestDb, sql: string) => Number(raw.prepare(sql).get()!.n);

let server: FakeServer;
beforeEach(() => {
  n = 0;
  server = new FakeServer();
});

describe('push', () => {
  it('sends parents before children and empties the outbox', async () => {
    const a = phone();
    const plotId = createPlot(
      a.db,
      OWNER,
      { name: 'Uma' },
      clock(() => 1),
    );
    a.db.run(
      `insert into cycle (id, plot_id, crop_id, planted_on, status, owner_id, created_at, updated_at)
       values ('c1', ?, 'crop-corn', '2026-06-01', 'growing', ?, 1, 1)`,
      [plotId, OWNER],
    );
    a.db.run(
      `insert into outbox (id, table_name, row_id, op, payload, created_at)
       values ('o-c1', 'cycle', 'c1', 'insert', '{}', 0)`,
      [],
    );
    recordExpense(
      a.db,
      OWNER,
      { cycleId: 'c1', category: 'seed', amountCentavos: 100, spentOn: '2026-06-01' },
      clock(() => 2),
    );

    expect(await push(a.db, server)).toEqual({ pushed: 3 });
    expect(server.upserts).toEqual(['plot', 'cycle', 'expense']);
    expect(count(a.raw, 'select count(*) as n from outbox')).toBe(0);
  });

  it('sends five offline edits to one row as one row, in its latest state', async () => {
    const a = phone();
    let t = 0;
    const id = createPlot(
      a.db,
      OWNER,
      { name: 'v0' },
      clock(() => ++t),
    );
    for (let i = 1; i <= 4; i++) {
      a.db.run('update plot set name = ?, updated_at = ? where id = ?', [`v${i}`, ++t, id]);
      a.db.run(
        `insert into outbox (id, table_name, row_id, op, payload, created_at)
         values (?, 'plot', ?, 'update', '{}', ?)`,
        [`o${i}`, id, t],
      );
    }
    expect(await push(a.db, server)).toEqual({ pushed: 1 });
    expect(server.table('plot').get(id)?.name).toBe('v4');
  });

  it('keeps the outbox and records the error when the server is unreachable', async () => {
    const a = phone();
    createPlot(
      a.db,
      OWNER,
      { name: 'Uma' },
      clock(() => 1),
    );
    server.failOn = 'plot';
    await expect(push(a.db, server)).rejects.toThrow('offline');
    expect(a.raw.prepare('select attempts, last_error from outbox').get()).toEqual({
      attempts: 1,
      last_error: 'offline',
    });
  });
});

describe('two phones, one farmer', () => {
  it('restores a whole farm onto a new phone', async () => {
    const a = phone();
    seedDemoFarm(a.db, OWNER, '2026-09-27', () => `demo-${++n}`);
    // The sample farm skips the outbox on purpose; queue it as real records would be.
    for (const table of ['plot', 'cycle', 'expense', 'harvest', 'sale']) {
      a.db.run(
        `insert into outbox (id, table_name, row_id, op, payload, created_at)
         select 'o-' || id, ?, id, 'insert', '{}', created_at from ${table}`,
        [table],
      );
    }
    await syncOnce(a.db, server);

    const b = phone();
    const { pulled } = await syncOnce(b.db, server);
    expect(pulled).toBeGreaterThan(0);
    const net = (raw: TestDb) =>
      raw.prepare(`select sum(net_centavos) as n from cycle_pnl`).get()!.n;
    expect(net(b.raw)).toBe(net(a.raw));
  });

  it('lets the newer edit win, whichever phone syncs last', async () => {
    const a = phone();
    const b = phone();
    const id = createPlot(
      a.db,
      OWNER,
      { name: 'Uma' },
      clock(() => 100),
    );
    await syncOnce(a.db, server);
    await syncOnce(b.db, server);

    // B renames later (t=300) but syncs first; A's older rename (t=200) arrives after.
    b.db.run('update plot set name = ?, updated_at = 300 where id = ?', ['Gikan sa B', id]);
    b.db.run(
      `insert into outbox (id, table_name, row_id, op, payload, created_at)
       values ('ob', 'plot', ?, 'update', '{}', 300)`,
      [id],
    );
    a.db.run('update plot set name = ?, updated_at = 200 where id = ?', ['Gikan sa A', id]);
    a.db.run(
      `insert into outbox (id, table_name, row_id, op, payload, created_at)
       values ('oa', 'plot', ?, 'update', '{}', 200)`,
      [id],
    );
    await syncOnce(b.db, server);
    await syncOnce(a.db, server);

    const name = (raw: TestDb) => raw.prepare('select name from plot').get()!.name;
    expect(server.table('plot').get(id)?.name).toBe('Gikan sa B');
    expect(name(a.raw)).toBe('Gikan sa B');
  });

  it('pulls only what changed since the last pull', async () => {
    const a = phone();
    createPlot(
      a.db,
      OWNER,
      { name: 'Uma' },
      clock(() => 1),
    );
    await syncOnce(a.db, server);
    const b = phone();
    await pull(b.db, server);
    expect(await pull(b.db, server)).toEqual({ pulled: 0 });
  });

  it('does not pull when the push failed', async () => {
    const a = phone();
    createPlot(
      a.db,
      OWNER,
      { name: 'Uma' },
      clock(() => 1),
    );
    server.failOn = 'plot';
    const spy = jest.spyOn(server, 'pull');
    await expect(syncOnce(a.db, server)).rejects.toThrow();
    expect(spy).not.toHaveBeenCalled();
  });
});
