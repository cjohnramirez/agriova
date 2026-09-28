import type { SqlDb, SqlValue } from '@/db/write';

/**
 * The sync engine: push what the phone wrote, then pull what changed on the
 * server. Plain functions over the local database and a `Remote`, so the
 * whole thing is tested against real SQLite and a fake server.
 *
 * Rules, in the order they matter:
 *
 * 1. Push before pull, and skip the pull if the push failed. A pull must never
 *    see a server row older than an edit still sitting in the outbox.
 * 2. Parents before children (plot, cycle, expense, harvest, sale), because the
 *    server's foreign keys reject a cycle whose plot has not arrived.
 * 3. Push the row as it is now, not each queued payload. Five edits to one
 *    expense while offline become one upsert of its latest state.
 * 4. Last write wins on `updated_at`, the phone's clock, on both sides.
 * 5. Pull by the server's own `synced_at`, so a phone with a wrong clock still
 *    receives every change.
 */

export const PUSH_ORDER = ['plot', 'cycle', 'expense', 'harvest', 'sale'] as const;
export const PULL_ORDER = ['crop', ...PUSH_ORDER] as const;

export type PushTable = (typeof PUSH_ORDER)[number];
export type PullTable = (typeof PULL_ORDER)[number];
export type Row = Record<string, SqlValue>;

export interface Remote {
  /** Inserts or updates rows by id. The server applies last-write-wins. */
  upsert(table: PushTable, rows: Row[]): Promise<void>;
  /** Up to `limit` rows with `synced_at` after `since`, oldest first. */
  pull(table: PullTable, since: number, limit: number): Promise<Row[]>;
}

const PAGE = 500;

/** Local column names, read from SQLite so a migration cannot drift from sync. */
function columnsOf(db: SqlDb, table: string): string[] {
  return db
    .all<{ name: string }>('select name from pragma_table_info(?)', [table])
    .map((c) => c.name);
}

// --- Push -------------------------------------------------------------------

export type PushResult = { pushed: number };

/**
 * Sends every queued row, table by table in parent-first order. Outbox entries
 * are removed only after the server accepted their table; an entry queued
 * while the push was in flight stays for next time.
 *
 * Throws on the first failure, after recording it on the entries, so nothing
 * later in the order is sent against a missing parent.
 */
export async function push(db: SqlDb, remote: Remote): Promise<PushResult> {
  let pushed = 0;

  for (const table of PUSH_ORDER) {
    const queued = db.all<{ id: string; row_id: string }>(
      'select id, row_id from outbox where table_name = ? order by created_at, rowid',
      [table],
    );
    if (queued.length === 0) continue;

    const ids = [...new Set(queued.map((q) => q.row_id))];
    const rows = db.all<Row>(
      `select * from ${table} where id in (${ids.map(() => '?').join(', ')})`,
      ids,
    );

    try {
      if (rows.length) await remote.upsert(table, rows);
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      db.run(
        `update outbox set attempts = attempts + 1, last_error = ?
         where id in (${queued.map(() => '?').join(', ')})`,
        [message, ...queued.map((q) => q.id)],
      );
      throw error;
    }

    db.run(
      `delete from outbox where id in (${queued.map(() => '?').join(', ')})`,
      queued.map((q) => q.id),
    );
    pushed += rows.length;
  }

  return { pushed };
}

// --- Pull -------------------------------------------------------------------

export type PullResult = { pulled: number };

/**
 * Applies server rows newer than the last pull, table by table. A server row
 * replaces the local one only if it is at least as new; the phone's own edits
 * were pushed first, so a newer local row here is one the server is about to
 * receive.
 */
export async function pull(db: SqlDb, remote: Remote): Promise<PullResult> {
  let pulled = 0;

  for (const table of PULL_ORDER) {
    const columns = columnsOf(db, table);
    const [state] = db.all<{ last_pulled_at: number }>(
      'select last_pulled_at from sync_state where table_name = ?',
      [table],
    );
    let since = state?.last_pulled_at ?? 0;

    for (;;) {
      const rows = await remote.pull(table, since, PAGE);
      if (rows.length === 0) break;

      db.transaction(() => {
        for (const row of rows) applyRow(db, table, columns, row);
        since = Math.max(since, ...rows.map((r) => Number(r.synced_at)));
        db.run(
          `insert into sync_state (table_name, last_pulled_at) values (?, ?)
           on conflict (table_name) do update set last_pulled_at = excluded.last_pulled_at`,
          [table, since],
        );
      });
      pulled += rows.length;
      if (rows.length < PAGE) break;
    }
  }

  return { pulled };
}

function applyRow(db: SqlDb, table: string, columns: string[], row: Row) {
  // Only columns the phone has; the server adds synced_at.
  const present = columns.filter((c) => c in row);
  const updates = present.filter((c) => c !== 'id').map((c) => `${c} = excluded.${c}`);
  db.run(
    `insert into ${table} (${present.join(', ')}) values (${present.map(() => '?').join(', ')})
     on conflict (id) do update set ${updates.join(', ')}
     where excluded.updated_at >= ${table}.updated_at`,
    present.map((c) => row[c] ?? null),
  );
}

// --- Both -------------------------------------------------------------------

export type SyncResult = PushResult & PullResult;

/** One full round: push, then pull. */
export async function syncOnce(db: SqlDb, remote: Remote): Promise<SyncResult> {
  const { pushed } = await push(db, remote);
  const { pulled } = await pull(db, remote);
  return { pushed, pulled };
}
