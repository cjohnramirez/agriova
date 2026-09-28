import 'react-native-url-polyfill/auto';
import 'expo-sqlite/localStorage/install';

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { AppState } from 'react-native';

const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

/**
 * React Native's fetch never times out: on weak rural signal a stalled
 * request waits forever and so does the button that sent it. Every Supabase
 * call gets a deadline instead, and fails into the "check your signal" path.
 */
const TIMEOUT_MS = 20_000;

function withDeadline(input: RequestInfo | URL, init: RequestInit | undefined, ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  init?.signal?.addEventListener('abort', () => controller.abort());
  return fetch(input, { ...init, signal: controller.signal }).finally(() => clearTimeout(timer));
}

/**
 * Mobile networks silently drop a connection that sits idle for a minute or
 * two, and the phone keeps it for reuse anyway. The next request goes down
 * the dead connection and never gets an answer. Seen on the emulator over a
 * phone hotspot: the code check, sent a minute after the code, hung every time.
 *
 * So after a quiet spell, a tiny health check goes first with a short
 * deadline. Either it succeeds on a live connection, or it fails and the dead
 * one is thrown away; the real request then goes out on a working one.
 */
const IDLE_MS = 45_000;
const WARMUP_MS = 6_000;
let lastAnswer = 0;

const fetchWithWarmup: typeof fetch = async (input, init) => {
  if (url && key && Date.now() - lastAnswer > IDLE_MS) {
    await withDeadline(`${url}/auth/v1/health`, { headers: { apikey: key } }, WARMUP_MS).catch(
      () => {},
    );
  }
  const response = await withDeadline(input, init, TIMEOUT_MS);
  lastAnswer = Date.now();
  return response;
};

/**
 * The Supabase client, or null when the project has no keys configured.
 *
 * Null is a supported state, not an error: tests, CI and a fresh clone run
 * without keys, and the app then signs in locally and keeps everything on the
 * phone. Only the publishable key is ever in the app; anything privileged
 * lives in Edge Functions.
 *
 * The auth session is stored with expo-sqlite's localStorage, as Supabase's
 * Expo guide does. SecureStore caps values at 2 KB, which a session exceeds.
 */
export const supabase: SupabaseClient | null =
  url && key
    ? createClient(url, key, {
        global: { fetch: fetchWithWarmup },
        auth: {
          storage: localStorage,
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: false,
        },
      })
    : null;

// Refresh the token only while the app is in front. A backgrounded app that
// keeps refreshing wakes the radio for nothing, on phones with little battery.
if (supabase) {
  AppState.addEventListener('change', (state) => {
    if (state === 'active') supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
