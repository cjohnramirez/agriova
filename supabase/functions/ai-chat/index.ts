// Supabase Edge Function: the farm assistant. Deno runtime.
//
// POST { question, language, history, farm } with the farmer's session token.
// 401 not signed in, 400 bad request, 429 daily limit reached, 502 model failed,
// 200 { answer }.
//
// Secrets (set with `npx supabase secrets set NAME=value`, never in the app):
//   GEMINI_API_KEY   from Google AI Studio (or swap the fetch for Vertex AI)
//   GEMINI_MODEL     optional, defaults to gemini-3.1-flash-lite

import { createClient } from 'npm:@supabase/supabase-js@2';

import { DAILY_LIMIT, geminiBody, parseGemini, validateRequest } from './core.ts';

const MODEL = Deno.env.get('GEMINI_MODEL') ?? 'gemini-3.1-flash-lite';

const reply = (status: number, body: unknown) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'content-type': 'application/json' },
  });

Deno.serve(async (req) => {
  if (req.method !== 'POST') return reply(405, { error: 'method' });

  // Act as the farmer: their token, so the quota function sees auth.uid().
  const authorization = req.headers.get('Authorization') ?? '';
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_ANON_KEY') ?? Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!,
    { global: { headers: { Authorization: authorization } } },
  );
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return reply(401, { error: 'signed_out' });

  const request = validateRequest(await req.json().catch(() => null));
  if (typeof request === 'string') return reply(400, { error: request });

  const { data: allowed, error: quotaError } = await supabase.rpc('ai_use_quota', {
    daily_limit: DAILY_LIMIT,
  });
  if (quotaError) return reply(500, { error: 'quota' });
  if (!allowed) return reply(429, { error: 'limit' });

  const key = Deno.env.get('GEMINI_API_KEY');
  if (!key) return reply(500, { error: 'not_configured' });

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`,
    {
      method: 'POST',
      headers: { 'content-type': 'application/json', 'x-goog-api-key': key },
      body: JSON.stringify(geminiBody(request)),
    },
  );
  if (!res.ok) return reply(502, { error: 'model', status: res.status });

  const answer = parseGemini(await res.json());
  return answer ? reply(200, { answer }) : reply(502, { error: 'empty' });
});
