import { addDatabaseChangeListener } from 'expo-sqlite';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AppState } from 'react-native';

import { supabase } from '@/backend/supabase';
import { deviceRunner } from '@/db/client';

import { syncOnce } from './engine';
import { supabaseRemote } from './supabaseRemote';

/** After a write, wait this long so a burst of edits goes up as one push. */
const DEBOUNCE_MS = 3_000;
/** Pull at least this often while the app is open, for edits from other phones. */
const INTERVAL_MS = 5 * 60_000;

type SyncStatus = {
  /** False when no Supabase keys are configured: records stay on the phone. */
  enabled: boolean;
  syncing: boolean;
  lastSyncedAt: number | null;
  /** The last failure, usually no signal. Cleared by the next success. */
  error: string | null;
  syncNow: () => Promise<void>;
};

const SyncContext = createContext<SyncStatus | null>(null);

/**
 * Runs sync in the background while a farmer is signed in: on start, when
 * the app comes back to the front, shortly after any write, and every few
 * minutes. Only one round runs at a time. Failures are expected (no signal in
 * the field) and harmless: the outbox keeps everything until the next round.
 */
export function SyncProvider({ signedIn, children }: { signedIn: boolean; children: ReactNode }) {
  const enabled = !!supabase && signedIn;
  const running = useRef(false);
  const [state, setState] = useState<Omit<SyncStatus, 'enabled' | 'syncNow'>>({
    syncing: false,
    lastSyncedAt: null,
    error: null,
  });

  const syncNow = useCallback(async () => {
    if (!enabled || !supabase || running.current) return;
    running.current = true;
    setState((s) => ({ ...s, syncing: true }));
    try {
      await syncOnce(deviceRunner, supabaseRemote(supabase));
      setState({ syncing: false, lastSyncedAt: Date.now(), error: null });
    } catch (error) {
      setState((s) => ({
        ...s,
        syncing: false,
        error: error instanceof Error ? error.message : String(error),
      }));
    } finally {
      running.current = false;
    }
  }, [enabled]);

  useEffect(() => {
    if (!enabled) return;
    void syncNow();

    const foreground = AppState.addEventListener('change', (next) => {
      if (next === 'active') void syncNow();
    });
    const interval = setInterval(() => void syncNow(), INTERVAL_MS);

    // Only a change to the outbox means there is something new to send; pulls
    // write other tables. Changes during a round are the push clearing the
    // outbox, which must not schedule another round.
    let timer: ReturnType<typeof setTimeout> | undefined;
    const writes = addDatabaseChangeListener((event) => {
      if (event.tableName !== 'outbox' || running.current) return;
      clearTimeout(timer);
      timer = setTimeout(() => void syncNow(), DEBOUNCE_MS);
    });

    return () => {
      foreground.remove();
      writes.remove();
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [enabled, syncNow]);

  const value = useMemo(() => ({ ...state, enabled, syncNow }), [state, enabled, syncNow]);
  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useSync(): SyncStatus {
  const value = useContext(SyncContext);
  if (!value) throw new Error('useSync must be used inside SyncProvider');
  return value;
}
