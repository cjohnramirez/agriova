import { formatPhone, isValidCode, isValidPhone, normalizePhone, toE164 } from './phone';

describe('normalizePhone', () => {
  it.each([
    ['9171234567', '9171234567'],
    ['0917 123 4567', '9171234567'],
    ['+63 917-123-4567', '9171234567'],
    ['639171234567', '9171234567'],
    ['(0917) 123.4567', '9171234567'],
  ])('reduces %s to the ten national digits', (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it('never grows past ten digits while typing', () => {
    expect(normalizePhone('91712345678')).toBe('9171234567');
  });

  // Partial input must survive as-is so the field does not fight the typist.
  it('leaves a partial number alone', () => expect(normalizePhone('917')).toBe('917'));
});

describe('isValidPhone', () => {
  it('accepts a ten-digit number starting with 9', () =>
    expect(isValidPhone('9171234567')).toBe(true));
  it.each(['8171234567', '917123456', ''])('rejects %p', (n) =>
    expect(isValidPhone(n)).toBe(false),
  );
});

describe('formatting', () => {
  it('groups digits the way they are read aloud', () =>
    expect(formatPhone('9171234567')).toBe('917 123 4567'));
  it('groups a partial number', () => expect(formatPhone('9171')).toBe('917 1'));
  it('adds the country code for the OTP provider', () =>
    expect(toE164('9171234567')).toBe('+639171234567'));
});

describe('isValidCode', () => {
  it('accepts six digits', () => expect(isValidCode('004213')).toBe(true));
  it.each(['12345', '1234567', 'abcdef'])('rejects %p', (c) => expect(isValidCode(c)).toBe(false));
});
