import type { StringKey } from '@/i18n/strings';
import type { Forecast } from '@/weather/forecast';

import type { ProduceOnHand } from './spoilage';

/**
 * The on-phone "AI Suggests / AI Warning / AI Approves" cards: plain rules
 * over the farmer's records and the cached forecast. They run with no signal,
 * cost nothing, and never guess; the chat is for everything else.
 *
 * Rules return string keys and values rather than sentences, so the same
 * advice reads in either language and the rules stay testable.
 */

export type AdviceKind = 'warning' | 'suggest' | 'approve';

export type Advice = {
  id: string;
  kind: AdviceKind;
  title: StringKey;
  body: StringKey;
  vars: Record<string, string | number>;
};

/**
 * PAGASA heat index bands: 33-41°C "extreme caution", 42°C and up "danger".
 * Apparent temperature stands in for heat index; they track closely in humid
 * lowland heat.
 */
const CAUTION_C = 33;
const DANGER_C = 42;
/** A spray or fertilizer applied before rain washes off. */
const RAIN_CHANCE = 70;
/** Field work hours: advice is about when to be out on the land. */
const WORK_START = 6;
const WORK_END = 18;

/** "11 AM", "12 PM", "3 PM". AM/PM reads the same in Bisaya usage. */
export function formatHour(hour: number): string {
  const h = hour % 12 === 0 ? 12 : hour % 12;
  return `${h} ${hour < 12 ? 'AM' : 'PM'}`;
}

const hourOf = (time: string) => Number(time.slice(11, 13));

function heatAdvice(forecast: Forecast, today: string): Advice | null {
  const hot = forecast.hours.filter(
    (h) =>
      h.time.startsWith(today) &&
      hourOf(h.time) >= WORK_START &&
      hourOf(h.time) < WORK_END &&
      h.feelsLike >= CAUTION_C,
  );
  if (hot.length === 0) return null;

  const max = Math.round(Math.max(...hot.map((h) => h.feelsLike)));
  const vars = {
    start: formatHour(hourOf(hot[0].time)),
    // The window runs to the end of its last hot hour.
    end: formatHour(hourOf(hot[hot.length - 1].time) + 1),
    max,
  };
  return max >= DANGER_C
    ? {
        id: 'heat',
        kind: 'warning',
        title: 'adviceHeatDangerTitle',
        body: 'adviceHeatDangerBody',
        vars,
      }
    : { id: 'heat', kind: 'suggest', title: 'adviceHeatTitle', body: 'adviceHeatBody', vars };
}

function rainAdvice(forecast: Forecast, today: string, nowHour: number): Advice | null {
  const wet = forecast.hours.find(
    (h) =>
      h.time.startsWith(today) &&
      hourOf(h.time) >= nowHour &&
      hourOf(h.time) < WORK_END &&
      h.rainChance >= RAIN_CHANCE,
  );
  if (!wet) return null;
  return {
    id: 'rain',
    kind: 'suggest',
    title: 'adviceRainTitle',
    body: 'adviceRainBody',
    vars: { start: formatHour(hourOf(wet.time)), chance: wet.rainChance },
  };
}

function produceAdvice(produce: readonly ProduceOnHand[]): Advice[] {
  return produce
    .filter((p) => p.level !== 'fresh')
    .map((p) => ({
      id: `produce-${p.id}`,
      kind: p.level === 'urgent' ? 'warning' : 'suggest',
      title: 'sellSoonTitle',
      body: 'adviceSellBody',
      vars: { cropBis: p.cropBis, cropEn: p.cropEn, plot: p.plotName, days: p.daysLeft },
    }));
}

const ORDER: Record<AdviceKind, number> = { warning: 0, suggest: 1, approve: 2 };

/**
 * Today's advice, most serious first. With a forecast and nothing to warn
 * about, one "good day for field work" card, so the farmer knows the check
 * ran rather than seeing nothing.
 */
export function buildAdvice(input: {
  today: string;
  nowHour: number;
  forecast: Forecast | null;
  produce: readonly ProduceOnHand[];
}): Advice[] {
  const { today, nowHour, forecast, produce } = input;
  const advice: Advice[] = [
    ...(forecast
      ? [heatAdvice(forecast, today), rainAdvice(forecast, today, nowHour)].filter(
          (a): a is Advice => a !== null,
        )
      : []),
    ...produceAdvice(produce),
  ];

  if (forecast && !advice.some((a) => a.id === 'heat' || a.id === 'rain')) {
    advice.push({
      id: 'clear',
      kind: 'approve',
      title: 'adviceClearTitle',
      body: 'adviceClearBody',
      vars: {},
    });
  }
  return advice.sort((a, b) => ORDER[a.kind] - ORDER[b.kind]);
}
