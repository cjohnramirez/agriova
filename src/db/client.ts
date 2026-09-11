import { openDatabaseSync } from 'expo-sqlite';
import { drizzle } from 'drizzle-orm/expo-sqlite';
import { sql } from 'drizzle-orm';

import * as schema from './schema';
import { SEED_CROPS } from './seed';

export const DATABASE_NAME = 'agriova.db';

/**
 * The single SQLite connection for the app.
 *
 * WAL is enabled because a write must never block a read. On this app a read is
 * the profit figure on the home screen, and a farmer who taps save should see
 * that number update immediately rather than wait behind the write.
 */
export const sqliteDb = openDatabaseSync(DATABASE_NAME, { enableChangeListener: true });

sqliteDb.execSync('PRAGMA journal_mode = WAL;');
// Off by default in SQLite, and the schema leans on foreign keys to stop
// orphaned rows from being pushed to the server.
sqliteDb.execSync('PRAGMA foreign_keys = ON;');

export const db = drizzle(sqliteDb, { schema });

export type Database = typeof db;

/**
 * Inserts the starter crop list. Safe to call on every launch: rows are keyed
 * by a stable id and left alone if they already exist, so a later server pull
 * that updates a shelf life is not undone on the next cold start.
 */
export async function seedReferenceData(): Promise<void> {
  const now = Date.now();

  await db
    .insert(schema.crop)
    .values(
      SEED_CROPS.map((crop, index) => ({
        id: crop.id,
        nameBis: crop.nameBis,
        nameEn: crop.nameEn,
        icon: crop.icon,
        shelfLifeDays: crop.shelfLifeDays,
        defaultUnit: crop.defaultUnit,
        sortOrder: index,
        updatedAt: now,
      })),
    )
    .onConflictDoNothing();
}

/** Wipes all local data. Used when a different user signs in on the same device. */
export async function resetLocalData(): Promise<void> {
  await db.run(sql`delete from outbox`);
  await db.run(sql`delete from sale`);
  await db.run(sql`delete from harvest`);
  await db.run(sql`delete from expense`);
  await db.run(sql`delete from cycle`);
  await db.run(sql`delete from plot`);
  await db.run(sql`delete from sync_state`);
}
