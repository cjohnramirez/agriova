/**
 * The day's weather, for the heat and rain advice. From Open-Meteo: free, no
 * key, and hourly "feels like" temperature, which is what heat-stress advice
 * needs. Open-Meteo's free API is for non-commercial use; before a paid
 * release either take its commercial plan or swap the fetch below, since the
 * rest of the app only sees `Forecast`.
 *
 * A forecast is cached, so the advice keeps working in the field with no
 * signal, and refreshed at most hourly.
 */

export type Sky = 'clear' | 'cloudy' | 'fog' | 'rain' | 'storm';

export type Hour = {
  /** Local 'YYYY-MM-DDTHH:00', in Asia/Manila. */
  time: string;
  /** °C */
  temp: number;
  /** Apparent temperature, °C: the heat-index figure PAGASA warns by. */
  feelsLike: number;
  /** 0-100 */
  rainChance: number;
};

export type Forecast = {
  fetchedAt: number;
  current: { temp: number; sky: Sky };
  hours: Hour[];
};

/** Where the pilot farms are: Cagayan de Oro. Plot GPS pins replace this later. */
export const PILOT_LOCATION = { latitude: 8.4542, longitude: 124.6319 };

const REFRESH_MS = 60 * 60_000;
/** Older than this, a cached forecast says nothing useful about today. */
const STALE_MS = 36 * 60 * 60_000;
const CACHE_KEY = 'agriova.forecast.v1';

/** WMO weather codes, as Open-Meteo reports them, folded into five skies. */
export function skyOf(code: number): Sky {
  if (code >= 95) return 'storm';
  if (code >= 51) return 'rain';
  if (code === 45 || code === 48) return 'fog';
  if (code >= 2) return 'cloudy';
  return 'clear';
}

type OpenMeteoResponse = {
  current?: { temperature_2m?: number; weather_code?: number };
  hourly?: {
    time?: string[];
    temperature_2m?: number[];
    apparent_temperature?: number[];
    precipitation_probability?: (number | null)[];
  };
};

/** Parses Open-Meteo's JSON. Returns null for anything missing or malformed. */
export function parseForecast(json: unknown, fetchedAt: number): Forecast | null {
  const data = json as OpenMeteoResponse;
  const h = data?.hourly;
  const temp = data?.current?.temperature_2m;
  const code = data?.current?.weather_code;
  if (!h?.time || !h.temperature_2m || !h.apparent_temperature || temp == null || code == null) {
    return null;
  }
  const hours = h.time.map((time, i) => ({
    time,
    temp: h.temperature_2m![i],
    feelsLike: h.apparent_temperature![i],
    rainChance: h.precipitation_probability?.[i] ?? 0,
  }));
  return { fetchedAt, current: { temp, sky: skyOf(code) }, hours };
}

export function forecastUrl({ latitude, longitude } = PILOT_LOCATION): string {
  const params = new URLSearchParams({
    latitude: String(latitude),
    longitude: String(longitude),
    current: 'temperature_2m,weather_code',
    hourly: 'temperature_2m,apparent_temperature,precipitation_probability',
    timezone: 'Asia/Manila',
    forecast_days: '2',
  });
  return `https://api.open-meteo.com/v1/forecast?${params}`;
}

/** The slice of Web Storage the cache needs; localStorage on the phone. */
export interface KeyValue {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
}

export function readCached(store: KeyValue, now: number): Forecast | null {
  try {
    const cached = JSON.parse(store.getItem(CACHE_KEY) ?? 'null') as Forecast | null;
    return cached && now - cached.fetchedAt < STALE_MS ? cached : null;
  } catch {
    return null;
  }
}

/**
 * The cached forecast, refreshed from the network when it is over an hour
 * old. With no signal the cache is kept and returned as it is.
 */
export async function loadForecast(
  store: KeyValue,
  fetcher: (url: string) => Promise<unknown>,
  now: number,
): Promise<Forecast | null> {
  const cached = readCached(store, now);
  if (cached && now - cached.fetchedAt < REFRESH_MS) return cached;
  try {
    const fresh = parseForecast(await fetcher(forecastUrl()), now);
    if (fresh) {
      store.setItem(CACHE_KEY, JSON.stringify(fresh));
      return fresh;
    }
  } catch {
    // No signal: fall through to whatever is cached.
  }
  return cached;
}
