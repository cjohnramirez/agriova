/**
 * The money, quantity and date helpers are five-line functions, which is exactly
 * why they are worth testing: they are easy to write slightly wrong and every
 * peso figure in the app flows through them.
 */
import {
  addDays,
  formatPesos,
  formatQuantity,
  pesosToCentavos,
  quantityToMilli,
  saleTotalCentavos,
  todayLocal,
} from './units';

describe('money', () => {
  it('converts whole pesos exactly', () => expect(pesosToCentavos(1200)).toBe(120_000));
  it('converts a centavo value exactly', () => expect(pesosToCentavos(38.5)).toBe(3850));
  // 0.1 + 0.2 style drift is the whole reason money is stored as an integer.
  it('rounds a value floats cannot hold, not truncates', () =>
    expect(pesosToCentavos(19.99)).toBe(1999));
  it('rounds a third of a peso to the nearest centavo', () =>
    expect(pesosToCentavos(0.335)).toBe(34));

  it('shows centavos on small amounts', () => expect(formatPesos(120_000)).toBe('₱1,200.00'));
  it('drops centavos on large amounts', () => expect(formatPesos(1_885_000)).toBe('₱18,850'));
  it('renders zero as a real number', () => expect(formatPesos(0)).toBe('₱0.00'));
  it('keeps the sign outside the symbol', () => expect(formatPesos(-45_000)).toBe('-₱450.00'));
  it('can force centavos on', () =>
    expect(formatPesos(1_885_000, { alwaysShowCentavos: true })).toBe('₱18,850.00'));
});

describe('quantities', () => {
  it('converts a whole quantity exactly', () => expect(quantityToMilli(420)).toBe(420_000));
  it('converts a fractional quantity exactly', () => expect(quantityToMilli(12.5)).toBe(12_500));
  it('shows no decimal tail on an integer', () =>
    expect(formatQuantity(420_000, 'kg', 'en')).toBe('420 kg'));
  it('shows two places on a fraction', () =>
    expect(formatQuantity(12_500, 'kg', 'en')).toBe('12.50 kg'));
  it('translates units', () => expect(formatQuantity(3000, 'sack', 'bis')).toBe('3 sako'));
});

describe('sale totals', () => {
  it('is exact for a clean total', () => expect(saleTotalCentavos(250_000, 3800)).toBe(950_000));
  // 12.5 kg at 38.50: the true total is 481.25, which must not silently truncate.
  it('rounds a fractional total once', () => expect(saleTotalCentavos(12_500, 3850)).toBe(48_125));
  it('yields zero for a zero quantity', () => expect(saleTotalCentavos(0, 3850)).toBe(0));
});

describe('dates', () => {
  // The bug being guarded against: toISOString converts to UTC first, so a
  // Philippine morning (UTC+8) reports the previous calendar day.
  const earlyMorningManila = new Date(2026, 7, 15, 6, 30);

  it('keeps an early morning on today', () =>
    expect(todayLocal(earlyMorningManila)).toBe('2026-08-15'));
  it('would have been wrong with toISOString', () =>
    expect(earlyMorningManila.toISOString().slice(0, 10)).toBe('2026-08-14'));
  it('keeps a late night on today', () =>
    expect(todayLocal(new Date(2026, 7, 15, 23, 45))).toBe('2026-08-15'));
  it('zero pads single digits', () => expect(todayLocal(new Date(2026, 0, 5))).toBe('2026-01-05'));
  it('adds days across a month', () => expect(addDays('2026-08-30', 5)).toBe('2026-09-04'));
  it('adds days across a year', () => expect(addDays('2026-12-30', 3)).toBe('2027-01-02'));
  it('subtracts days', () => expect(addDays('2026-03-01', -1)).toBe('2026-02-28'));
  it('handles a leap year', () => expect(addDays('2028-02-28', 1)).toBe('2028-02-29'));
  // Shelf life for banana is 7 days; the alert fires two days before it closes.
  it('computes a spoilage window', () => expect(addDays('2026-08-14', 7 - 2)).toBe('2026-08-19'));
});
