import { FunctionsHttpError } from '@supabase/supabase-js';

import { supabase } from '@/backend/supabase';
import type { Language } from '@/i18n/strings';

import type { Sender } from './chat';

/**
 * Sends a question to the `ai-chat` Edge Function. Requests go through the
 * Supabase client, so they carry the farmer's session and the app's network
 * timeout. No signal (or a timeout) reports `offline`, which keeps the
 * question queued; the function's 429 reports the daily limit.
 *
 * Without Supabase keys there is no assistant to reach: `failed`.
 */
export function supabaseSender(language: Language, farm: () => string): Sender {
  return async (question, history) => {
    if (!supabase) return { ok: false, reason: 'failed' };

    const { data, error } = await supabase.functions.invoke<{ answer?: string }>('ai-chat', {
      body: { question, language, history, farm: farm() },
    });

    if (error) {
      if (error instanceof FunctionsHttpError) {
        const status = (error.context as Response | undefined)?.status;
        return { ok: false, reason: status === 429 ? 'limit' : 'failed' };
      }
      // FunctionsFetchError / FunctionsRelayError: never reached the function.
      return { ok: false, reason: 'offline' };
    }
    return data?.answer ? { ok: true, answer: data.answer } : { ok: false, reason: 'failed' };
  };
}
