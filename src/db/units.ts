import type { Unit } from './schema';

/**
 * Conversions between what the database stores and what a person types.
 *
 * The database stores money as integer centavos and quantities as integer
 * thousandths of a unit. Every crossing of that boundary goes through this file
 * so that rounding happens in exactly one place and can be reasoned about.
 */

const CENTAVOS_PER_PESO = 100;
const MILLI_PER_UNIT = 1000;

// --- Money ----------------------------------------------------------------

/** Pesos as typed by a person, to stored centavos. Rounds to the nearest centavo. */
export function pesosToCentavos(pesos: number): number {
  return Math.round(pesos * CENTAVOS_PER_PESO);
}

export function centavosToPesos(centavos: number): number {
  return centavos / CENTAVOS_PER_PESO;
}

/**
 * Formats centavos for display. Always shows the peso sign and thousands
 * separators, because an unpunctuated five-figure number is genuinely hard to
 * read at a glance and this figure is the product.
 *
 * Centavos are dropped above ten thousand pesos: at that scale the two decimal
 * places are noise competing with the digits that matter.
 */
export function formatPesos(centavos: number, options?: { alwaysShowCentavos?: boolean }): string {
  const pesos = centavosToPesos(centavos);
  const showCentavos = options?.alwaysShowCentavos ?? Math.abs(pesos) < 10_000;
  const formatted = Math.abs(pesos).toLocaleString('en-PH', {
    minimumFractionDigits: showCentavos ? 2 : 0,
    maximumFractionDigits: showCentavos ? 2 : 0,
  });
  // The sign goes outside the symbol. Formatting the raw number would produce
  // "₱-450.00", and a cycle running at a loss is precisely when the figure has
  // to be unambiguous.
  return `${centavos < 0 ? '-' : ''}₱${formatted}`;
}

// --- Quantities -----------------------------------------------------------

/** A quantity as typed by a person, to stored thousandths. */
export function quantityToMilli(quantity: number): number {
  return Math.round(quantity * MILLI_PER_UNIT);
}

export function milliToQuantity(milli: number): number {
  return milli / MILLI_PER_UNIT;
}

const UNIT_LABELS: Record<Unit, { bis: string; en: string }> = {
  kg: { bis: 'kilo', en: 'kg' },
  sack: { bis: 'sako', en: 'sack' },
  piece: { bis: 'buok', en: 'pc' },
  bundle: { bis: 'bugkos', en: 'bundle' },
};

export function formatQuantity(milli: number, unit: Unit, language: 'bis' | 'en'): string {
  const quantity = milliToQuantity(milli);
  const trimmed = Number.isInteger(quantity) ? String(quantity) : quantity.toFixed(2);
  return `${trimmed} ${UNIT_LABELS[unit][language]}`;
}

// --- Sale arithmetic ------------------------------------------------------

/**
 * The total for a sale, rounded once at the point of entry.
 *
 * This result is stored on the row rather than recomputed on read. Quantity
 * times unit price rarely lands on a whole centavo, and rounding it again on
 * every read is how a profit total drifts away from the sum of its parts.
 */
export function saleTotalCentavos(quantityMilli: number, unitPriceCentavos: number): number {
  return Math.round((quantityMilli * unitPriceCentavos) / MILLI_PER_UNIT);
}

// --- Dates ----------------------------------------------------------------

/**
 * Today as a 'YYYY-MM-DD' calendar date in the device's own timezone.
 *
 * Deliberately not `toISOString`, which converts to UTC first and would hand a
 * farmer in the Philippines yesterday's date for anything logged before 8am.
 */
export function todayLocal(date: Date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/** Adds whole days to a 'YYYY-MM-DD' date, staying in calendar space. */
export function addDays(isoDate: string, days: number): string {
  const [year, month, day] = isoDate.split('-').map(Number);
  const shifted = new Date(year, month - 1, day + days);
  return todayLocal(shifted);
}
