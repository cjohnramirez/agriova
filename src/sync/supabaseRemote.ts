import type { SupabaseClient } from '@supabase/supabase-js';

import type { Remote } from './engine';

/**
 * `Remote` over Supabase's REST API. Row level security scopes every call to
 * the signed-in farmer, so there is no owner filter here: the server refuses
 * to return or accept anyone else's rows.
 */
export function supabaseRemote(client: SupabaseClient): Remote {
  return {
    async upsert(table, rows) {
      const { error } = await client.from(table).upsert(rows, { onConflict: 'id' });
      if (error) throw new Error(`${table}: ${error.message}`);
    },

    async pull(table, since, limit) {
      const { data, error } = await client
        .from(table)
        .select('*')
        .gt('synced_at', since)
        .order('synced_at', { ascending: true })
        .limit(limit);
      if (error) throw new Error(`${table}: ${error.message}`);
      return data ?? [];
    },
  };
}
