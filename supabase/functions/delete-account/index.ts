// Supabase Edge Function: deletes the caller's account and, by cascade, every
// record they own. Deno runtime.
//
// POST with the farmer's session token. 401 not signed in, 500 delete failed,
// 200 { deleted: true }.
//
// Uses the service role, which the Edge runtime provides as an environment
// variable. It never leaves the server; the app only holds the publishable key.

import { createClient } from 'npm:@supabase/supabase-js@2';

import { deleteAccount } from './core.ts';

Deno.serve(async (req) => {
  const url = Deno.env.get('SUPABASE_URL')!;

  const outcome = await deleteAccount(req.method, {
    async whoIsAsking() {
      const asCaller = createClient(
        url,
        Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!,
        { global: { headers: { Authorization: req.headers.get('Authorization') ?? '' } } },
      );
      const { data } = await asCaller.auth.getUser();
      return data.user?.id ?? null;
    },
    async removeUser(userId) {
      const admin = createClient(url, Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!, {
        auth: { persistSession: false },
      });
      // Hard delete: a soft delete would keep the rows the cascade must remove.
      const { error } = await admin.auth.admin.deleteUser(userId, false);
      return !error;
    },
  });

  return new Response(JSON.stringify(outcome.body), {
    status: outcome.status,
    headers: { 'content-type': 'application/json' },
  });
});
