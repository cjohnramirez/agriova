---
name: supabase-change
description: Use when changing the database in this app - adding or altering a table or column, a row level security policy, a server function, or anything under supabase/ or src/db/schema.ts - so the phone, the server and sync stay in step.
---

# Changing the database

The phone (SQLite via Drizzle, `src/db/schema.ts`) and the server (Postgres,
`supabase/migrations/`) hold the same farmer tables, column for column. Sync
(`src/sync/engine.ts`) copies rows between them by column name. A change made
on one side only breaks sync silently: the row pushes, the extra column is
dropped or rejected, and a farmer's record never reaches their other phone.

## Every change touches all of these

1. **Phone schema**: edit `src/db/schema.ts`, then `npm run db:generate` for
   the SQLite migration in `drizzle/`. Never edit generated SQL by hand.
2. **Server migration**: a new file in `supabase/migrations/`, named
   `YYYYMMDDHHMMSS_what.sql`. Never edit a migration that has been pushed;
   add another.
3. **Row level security** for any new farmer table, exactly like the existing
   ones: enable RLS, select/insert/update policies on
   `owner_id = (select auth.uid())`, no delete policy (deletes are soft).
   Child tables reference parents by `(parent_id, owner_id)`, so a farmer
   cannot attach rows to someone else's.
4. **Sync columns** on a new farmer table: `owner_id uuid default auth.uid()`,
   `created_at`, `updated_at`, `deleted_at` (bigint milliseconds),
   `synced_at bigint`, plus the `a_keep_newest` and `stamp_synced_at` triggers.
   Add the table to `PUSH_ORDER` in `src/sync/engine.ts`, after its parents.
5. **pgTAP test** in `supabase/tests/database/` proving another farmer cannot
   read or write the new rows.
6. **Write helper** in `src/db/write.ts` that inserts the row and its outbox
   entry in one transaction, with a test.

## Conventions

- Money is integer centavos, quantities integer thousandths, calendar dates
  `'YYYY-MM-DD'` text, instants bigint Unix milliseconds. Same on both sides.
- Enum-like columns get a `check (... in (...))` on both sides.
- Reference data (crops, prices) is read-only to farmers; only the service
  role writes it.
- Anything that needs the service role (deleting an account, writing prices)
  is an Edge Function, never the app. The app only ever holds the publishable
  key.
- A new farmer table must reference `auth.users (id) on delete cascade`
  through `owner_id`: account deletion (`delete-account`) relies on the
  cascade, and `delete_account.test.sql` must list the new table.

## Checking

- `npm run verify` covers the phone side and the sync engine.
- `npm run db:test` runs pgTAP locally (needs Docker; start the database with
  `npm run db:start` first). CI's `Database` workflow runs the same on every
  change under `supabase/`.
- John applies migrations to the hosted project with `npm run db:push` after
  `npx supabase link`. Hand him the command; do not push schema yourself. On
  networks that block Postgres ports, give him the migration as a SQL Editor
  paste that also inserts its row into `supabase_migrations.schema_migrations`.
- Edge Functions live in `supabase/functions/<name>/`: pure logic in
  `core.ts` (tested by Jest), the Deno entry in `index.ts`. John deploys with
  `npx supabase functions deploy <name> --use-api` and sets secrets with
  `npx supabase secrets set NAME=value`; keys never go in the app.
