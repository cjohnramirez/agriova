/**
 * Sign-in is by email for now: a 6-digit code is emailed and typed back.
 * Phone numbers and SMS come back once an SMS provider is budgeted for.
 */

/** Trims and lowercases, so "Nena@Gmail.com " and "nena@gmail.com" are one account. */
export function normalizeEmail(input: string): string {
  return input.trim().toLowerCase();
}

/**
 * Deliberately loose: something@something.something. The code we send is the
 * real check; a strict pattern only rejects addresses that would have worked.
 */
export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

export function isValidCode(code: string): boolean {
  return /^\d{6}$/.test(code);
}
