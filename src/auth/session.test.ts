import { onboardingStep, parseSession, statusOf, type Session } from './session';

const base: Session = { userId: 'u1', phone: '9171234567' };
const profile = { name: 'Nena', barangay: 'Gusa' };

describe('statusOf', () => {
  it('is signed out with no session', () => expect(statusOf(null)).toBe('signedOut'));
  it('is onboarding without a profile', () => expect(statusOf(base)).toBe('onboarding'));
  it('is onboarding with a profile but no first-plot decision', () =>
    expect(statusOf({ ...base, profile })).toBe('onboarding'));
  it('is ready once onboarding is finished', () =>
    expect(statusOf({ ...base, profile, onboardedAt: 1 })).toBe('ready'));
});

describe('onboardingStep', () => {
  it('asks for the profile first', () => expect(onboardingStep(base)).toBe('profile'));
  it('then the first plot', () => expect(onboardingStep({ ...base, profile })).toBe('plot'));
});

describe('parseSession', () => {
  it('round-trips a stored session', () =>
    expect(parseSession(JSON.stringify({ ...base, profile }))).toEqual({ ...base, profile }));
  it('treats nothing stored as signed out', () => expect(parseSession(null)).toBeNull());
  // A corrupt value must never lock a farmer out of the app.
  it.each(['{not json', '{}', '{"userId":1,"phone":"x"}'])('treats %p as signed out', (raw) =>
    expect(parseSession(raw)).toBeNull(),
  );
});
