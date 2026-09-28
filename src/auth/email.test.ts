import { isValidCode, isValidEmail, normalizeEmail } from './email';

describe('email', () => {
  it('normalizes case and spaces', () =>
    expect(normalizeEmail('  Nena.DelaCruz@Gmail.com ')).toBe('nena.delacruz@gmail.com'));

  it.each(['nena@gmail.com', 'a.b+farm@yahoo.com.ph'])('accepts %s', (email) =>
    expect(isValidEmail(email)).toBe(true),
  );

  it.each(['', 'nena', 'nena@', 'nena@gmail', 'ne na@gmail.com', '@gmail.com'])(
    'rejects %p',
    (email) => expect(isValidEmail(email)).toBe(false),
  );

  it('wants exactly six digits for a code', () => {
    expect(isValidCode('123456')).toBe(true);
    expect(isValidCode('12345')).toBe(false);
    expect(isValidCode('12345a')).toBe(false);
  });
});
