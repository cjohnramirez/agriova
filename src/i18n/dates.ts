import { addDays } from '@/db/units';
import type { WeekDay } from '@/ui';

import type { Language } from './strings';

/**
 * Dates in the farmer's language. Written out rather than taken from `Intl`
 * because Hermes carries no Cebuano locale data, and a Bisaya screen showing
 * English month names looks unfinished.
 *
 * Every input is a 'YYYY-MM-DD' calendar date, never a Date, so nothing here
 * can shift a day through a timezone conversion.
 */

const MONTHS: Record<Language, readonly string[]> = {
  en: [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ],
  bis: [
    'Enero',
    'Pebrero',
    'Marso',
    'Abril',
    'Mayo',
    'Hunyo',
    'Hulyo',
    'Agosto',
    'Septiyembre',
    'Oktubre',
    'Nobyembre',
    'Disyembre',
  ],
};

const WEEKDAYS: Record<Language, readonly string[]> = {
  en: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  bis: ['Domingo', 'Lunes', 'Martes', 'Miyerkules', 'Huwebes', 'Biyernes', 'Sabado'],
};

/** Weekday letters for the week strip, matching the prototype's "Su M T W". */
const WEEKDAY_SHORT: Record<Language, readonly string[]> = {
  en: ['Su', 'M', 'T', 'W', 'Th', 'F', 'Sa'],
  bis: ['Do', 'Lu', 'Ma', 'Mi', 'Hu', 'Bi', 'Sa'],
};

function parts(iso: string) {
  const [year, month, day] = iso.split('-').map(Number);
  return { year, month, day, weekday: new Date(year, month - 1, day, 12).getDay() };
}

const short = (name: string) => name.slice(0, 3);

/** "Sep 26". The year is left off: records are about this season. */
export function formatDate(iso: string, language: Language): string {
  const { month, day } = parts(iso);
  return `${short(MONTHS[language][month - 1])} ${day}`;
}

/** "Saturday, September 26", for screen readers and day headings. */
export function formatDateLong(iso: string, language: Language): string {
  const { month, day, weekday } = parts(iso);
  return `${WEEKDAYS[language][weekday]}, ${MONTHS[language][month - 1]} ${day}`;
}

/** "Sep" from 'YYYY-MM' or 'YYYY-MM-DD'. */
export function formatMonthShort(isoMonth: string, language: Language): string {
  return short(MONTHS[language][Number(isoMonth.slice(5, 7)) - 1]);
}

/** "September 2026" from 'YYYY-MM' or 'YYYY-MM-DD'. */
export function formatMonthYear(isoMonth: string, language: Language): string {
  return `${MONTHS[language][Number(isoMonth.slice(5, 7)) - 1]} ${isoMonth.slice(0, 4)}`;
}

/** The Sunday-to-Saturday week containing `iso`, for `WeekStrip`. */
export function weekOf(iso: string, language: Language): WeekDay[] {
  const sunday = addDays(iso, -parts(iso).weekday);
  return Array.from({ length: 7 }, (_, i) => {
    const date = addDays(sunday, i);
    return {
      date,
      weekday: WEEKDAY_SHORT[language][i],
      spoken: formatDateLong(date, language),
    };
  });
}
