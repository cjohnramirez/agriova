import { loadForecast, parseForecast, readCached, skyOf, type KeyValue } from './forecast';

const SAMPLE = {
  current: { temperature_2m: 31.2, weather_code: 3 },
  hourly: {
    time: ['2026-09-28T12:00', '2026-09-28T13:00'],
    temperature_2m: [31, 32],
    apparent_temperature: [38.5, 40.1],
    precipitation_probability: [20, null],
  },
};

function memory(): KeyValue & { data: Map<string, string> } {
  const data = new Map<string, string>();
  return { data, getItem: (k) => data.get(k) ?? null, setItem: (k, v) => void data.set(k, v) };
}

describe('forecast', () => {
  it('folds weather codes into five skies', () => {
    expect([0, 2, 45, 61, 95].map(skyOf)).toEqual(['clear', 'cloudy', 'fog', 'rain', 'storm']);
  });

  it('parses Open-Meteo hours, treating a missing rain chance as zero', () => {
    const f = parseForecast(SAMPLE, 1)!;
    expect(f.current).toEqual({ temp: 31.2, sky: 'cloudy' });
    expect(f.hours[1]).toEqual({
      time: '2026-09-28T13:00',
      temp: 32,
      feelsLike: 40.1,
      rainChance: 0,
    });
  });

  it('rejects a response it cannot use', () =>
    expect(parseForecast({ error: true }, 1)).toBeNull());

  it('fetches once, then serves the cache within the hour', async () => {
    const store = memory();
    const fetcher = jest.fn().mockResolvedValue(SAMPLE);
    await loadForecast(store, fetcher, 1_000);
    await loadForecast(store, fetcher, 1_000 + 30 * 60_000);
    expect(fetcher).toHaveBeenCalledTimes(1);
  });

  it('keeps the old forecast when there is no signal', async () => {
    const store = memory();
    await loadForecast(store, async () => SAMPLE, 1_000);
    const offline = await loadForecast(
      store,
      () => Promise.reject(new Error('offline')),
      1_000 + 2 * 3_600_000,
    );
    expect(offline?.fetchedAt).toBe(1_000);
  });

  it('drops a forecast too old to describe today', () => {
    const store = memory();
    store.setItem('agriova.forecast.v1', JSON.stringify(parseForecast(SAMPLE, 0)));
    expect(readCached(store, 40 * 3_600_000)).toBeNull();
  });
});
