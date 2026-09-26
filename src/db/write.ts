/**
 * Every farmer-authored write goes through here, so a row and its outbox entry
 * are always inserted in the same transaction. That is the guarantee the sync
 * engine relies on: nothing can exist locally without a pending push.
 *
 * Written against a tiny SQL interface rather than Drizzle so the exact same
 * code runs on the device (expo-sqlite) and in tests (node:sqlite).
 */

export type SqlValue = string | number | null;

export interface SqlRunner {
  run(sql: string, params: SqlValue[]): void;
  transaction(work: () => void): void;
}

type Clock = { now: () => number; uuid: () => string };

export type NewPlot = {
  name: string;
  /** Square metres. Optional: many farmers do not know their area. */
  areaSqm?: number | null;
};

export function createPlot(db: SqlRunner, ownerId: string, plot: NewPlot, clock: Clock): string {
  const name = plot.name.trim();
  if (!name) throw new Error('A plot needs a name.');

  const id = clock.uuid();
  const now = clock.now();
  const row = {
    id,
    name,
    area_sqm: plot.areaSqm ?? null,
    photo_uri: null,
    owner_id: ownerId,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  db.transaction(() => {
    db.run(
      `insert into plot (id, name, area_sqm, photo_uri, owner_id, created_at, updated_at, deleted_at)
       values (?, ?, ?, ?, ?, ?, ?, ?)`,
      [row.id, row.name, row.area_sqm, row.photo_uri, row.owner_id, now, now, null],
    );
    db.run(
      `insert into outbox (id, table_name, row_id, op, payload, created_at, attempts, last_error)
       values (?, 'plot', ?, 'insert', ?, ?, 0, null)`,
      [clock.uuid(), id, JSON.stringify(row), now],
    );
  });

  return id;
}
