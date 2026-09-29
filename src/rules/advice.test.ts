import type { Forecast, Hour } from '@/weather/forecast';

import { buildAdvice, formatHour } from './advice';
import type { ProduceOnHand } from './spoilage';

const TODAY = '2026-09-28';

/** A day's hours with a feels-like curve peaking at `peak` around 1 PM. */
function day(peak: number, rainAt: Record<number, number> = {}): Forecast {
  const hours: Hour[] = Array.from({ length: 24 }, (_, h) => ({
    time: `${TODAY}T${String(h).padStart(2, '0')}:00`,
    temp: 28,
    feelsLike: Math.round(peak - Math.abs(13 - h) * 2.5),
    rainChance: rainAt[h] ?? 10,
  }));
  return { fetchedAt: 0, current: { temp: 30, sky: 'cloudy' }, hours };
}

const produce = (level: ProduceOnHand['level'], daysLeft: number): ProduceOnHand => ({
  id: 'h1',
  harvestedOn: '2026-09-23',
  remainingMilli: 50_000,
  unit: 'kg',
  shelfLifeDays: 7,
  plotName: 'Duol sa suba',
  cropBis: 'Kamatis',
  cropEn: 'Tomato',
  daysLeft,
  level,
});

describe('formatHour', () => {
  it.each([
    [0, '12 AM'],
    [9, '9 AM'],
    [12, '12 PM'],
    [15, '3 PM'],
  ])('%i is %s', (hour, text) => expect(formatHour(hour)).toBe(text));
});

describe('buildAdvice', () => {
  it('warns of dangerous heat with the hours to avoid', () => {
    const [heat] = buildAdvice({ today: TODAY, nowHour: 7, forecast: day(44), produce: [] });
    expect(heat).toMatchObject({ kind: 'warning', title: 'adviceHeatDangerTitle' });
    expect(heat.vars).toEqual({ start: '9 AM', end: '6 PM', max: 44 });
  });

  it('suggests working early on a merely hot day', () => {
    const [heat] = buildAdvice({ today: TODAY, nowHour: 7, forecast: day(35), produce: [] });
    expect(heat).toMatchObject({ kind: 'suggest', title: 'adviceHeatTitle' });
    expect(heat.vars).toMatchObject({ start: '12 PM', end: '3 PM', max: 35 });
  });

  it('flags rain still to come today, not rain already past', () => {
    const forecast = day(30, { 8: 90, 16: 80 });
    const rain = buildAdvice({ today: TODAY, nowHour: 10, forecast, produce: [] }).find(
      (a) => a.id === 'rain',
    );
    expect(rain?.vars).toEqual({ start: '4 PM', chance: 80 });
  });

  it('says it is a good day when nothing needs a warning', () => {
    expect(buildAdvice({ today: TODAY, nowHour: 7, forecast: day(30), produce: [] })).toEqual([
      expect.objectContaining({ id: 'clear', kind: 'approve' }),
    ]);
  });

  it('gives no weather advice without a forecast, and no false all-clear', () =>
    expect(buildAdvice({ today: TODAY, nowHour: 7, forecast: null, produce: [] })).toEqual([]));

  it('puts warnings first', () => {
    const advice = buildAdvice({
      today: TODAY,
      nowHour: 7,
      forecast: day(35),
      produce: [produce('urgent', 1)],
    });
    expect(advice.map((a) => a.kind)).toEqual(['warning', 'suggest']);
    expect(advice[0].vars).toMatchObject({ cropEn: 'Tomato', days: 1 });
  });

  it('leaves fresh produce alone', () =>
    expect(
      buildAdvice({ today: TODAY, nowHour: 7, forecast: null, produce: [produce('fresh', 9)] }),
    ).toEqual([]));
});
