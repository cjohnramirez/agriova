import { useEffect, useState } from 'react';
import { AppState } from 'react-native';

import { loadForecast, readCached, type Forecast, type KeyValue } from './forecast';

/**
 * localStorage comes from expo-sqlite (installed in `backend/supabase.ts`).
 * Anywhere it is missing, the forecast just is not cached.
 */
function store(): KeyValue {
  if (typeof localStorage !== 'undefined') return localStorage;
  const memory = new Map<string, string>();
  return { getItem: (k) => memory.get(k) ?? null, setItem: (k, v) => void memory.set(k, v) };
}

const fetchJson = async (url: string) => {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`forecast ${res.status}`);
  return res.json();
};

/**
 * The cached forecast at once, refreshed in the background on open and each
 * time the app returns to the front. Null until a first forecast has ever
 * arrived; then weather advice simply does not appear.
 */
export function useForecast(): Forecast | null {
  const [forecast, setForecast] = useState<Forecast | null>(() => readCached(store(), Date.now()));

  useEffect(() => {
    let alive = true;
    const refresh = () =>
      loadForecast(store(), fetchJson, Date.now()).then((f) => alive && f && setForecast(f));
    void refresh();
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') void refresh();
    });
    return () => {
      alive = false;
      sub.remove();
    };
  }, []);

  return forecast;
}
