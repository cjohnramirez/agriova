/**
 * Philippine mobile numbers. People type them every way: 0917 123 4567,
 * +63 917-123-4567, 639171234567. Everything is reduced to the ten digits after
 * the country code, which is also what the OTP provider is sent with +63.
 */

/** Keeps only the ten national digits, dropping a leading 0, 63 or +63. */
export function normalizePhone(input: string): string {
  let digits = input.replace(/\D/g, '');
  if (digits.startsWith('63') && digits.length > 10) digits = digits.slice(2);
  if (digits.startsWith('0') && digits.length > 10) digits = digits.slice(1);
  return digits.slice(0, 10);
}

/** PH mobile numbers are ten digits starting with 9. */
export function isValidPhone(national: string): boolean {
  return /^9\d{9}$/.test(national);
}

/** "9171234567" to "917 123 4567", the grouping people read aloud. */
export function formatPhone(national: string): string {
  return [national.slice(0, 3), national.slice(3, 6), national.slice(6)].filter(Boolean).join(' ');
}

export const toE164 = (national: string) => `+63${national}`;

export function isValidCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}
