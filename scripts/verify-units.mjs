/**
 * Checks the money, quantity and date helpers.
 *
 * These are five-line functions, which is exactly why they are worth testing:
 * they are easy to write slightly wrong and every peso figure in the app flows
 * through them.
 *
 * Run with: npm run verify:units
 */
import {
  addDays,
  formatPesos,
  formatQuantity,
  pesosToCentavos,
  quantityToMilli,
  saleTotalCentavos,
  todayLocal,
} from '../src/db/units.ts';

let failures = 0;

function check(label, actual, expected) {
  const ok = Object.is(actual, expected);
  if (!ok) failures += 1;
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${label}`);
  if (!ok) console.log(`      expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}

// --- Money ----------------------------------------------------------------

check('whole pesos convert exactly', pesosToCentavos(1200), 120_000);
check('a centavo value converts exactly', pesosToCentavos(38.5), 3850);
// 0.1 + 0.2 style drift is the whole reason money is stored as an integer.
check('a value floats cannot hold is rounded, not truncated', pesosToCentavos(19.99), 1999);
check('a third of a peso rounds to the nearest centavo', pesosToCentavos(0.335), 34);

check('small amounts show centavos', formatPesos(120_000), '₱1,200.00');
check('large amounts drop the centavos', formatPesos(1_885_000), '₱18,850');
check('zero renders as a real number', formatPesos(0), '₱0.00');
check('negative amounts keep the sign', formatPesos(-45_000), '-₱450.00');
check('centavos can be forced on', formatPesos(1_885_000, { alwaysShowCentavos: true }), '₱18,850.00');

// --- Quantities -----------------------------------------------------------

check('a whole quantity converts exactly', quantityToMilli(420), 420_000);
check('a fractional quantity converts exactly', quantityToMilli(12.5), 12_500);
check('an integer quantity has no decimal tail', formatQuantity(420_000, 'kg', 'en'), '420 kg');
check('a fractional quantity shows two places', formatQuantity(12_500, 'kg', 'en'), '12.50 kg');
check('units are translated', formatQuantity(3000, 'sack', 'bis'), '3 sako');

// --- Sale totals ----------------------------------------------------------

check('a clean sale total is exact', saleTotalCentavos(250_000, 3800), 950_000);
// 12.5 kg at 38.50: the true total is 481.25, which must not silently truncate.
check('a fractional sale total rounds once', saleTotalCentavos(12_500, 3850), 48_125);
check('a zero quantity yields zero', saleTotalCentavos(0, 3850), 0);

// --- Dates ----------------------------------------------------------------
// The bug being guarded against: toISOString converts to UTC first, so a
// Philippine morning (UTC+8) reports the previous calendar day.

const earlyMorningManila = new Date(2026, 7, 15, 6, 30); // 15 Aug 2026, 6:30am local
check('an early morning stays on today', todayLocal(earlyMorningManila), '2026-08-15');
check('toISOString would have got this wrong', earlyMorningManila.toISOString().slice(0, 10), '2026-08-14');

const lateNight = new Date(2026, 7, 15, 23, 45);
check('a late night also stays on today', todayLocal(lateNight), '2026-08-15');

check('single digits are zero padded', todayLocal(new Date(2026, 0, 5)), '2026-01-05');
check('adding days crosses a month', addDays('2026-08-30', 5), '2026-09-04');
check('adding days crosses a year', addDays('2026-12-30', 3), '2027-01-02');
check('subtracting days works', addDays('2026-03-01', -1), '2026-02-28');
check('a leap year is handled', addDays('2028-02-28', 1), '2028-02-29');
// Shelf life for banana is 7 days; the alert fires two days before it closes.
check('a spoilage window computes', addDays('2026-08-14', 7 - 2), '2026-08-19');

console.log(`\n${failures === 0 ? 'All checks passed.' : `${failures} check(s) failed.`}`);
process.exit(failures === 0 ? 0 : 1);
