/**
 * The signed-in person, kept on the device. Until Supabase phone auth lands in
 * step 7, `userId` is a local UUID; the shape stays the same afterwards, with
 * the id coming from `auth.uid()` instead.
 */
export type Profile = {
  name: string;
  /** Free text for now. The pilot is Cagayan de Oro barangays. */
  barangay: string;
};

export type Session = {
  userId: string;
  /** Ten national digits; see `phone.ts`. */
  phone: string;
  profile?: Profile;
  /** Set once the farmer has added a first plot or chosen to skip it. */
  onboardedAt?: number;
};

export type SessionStatus = 'loading' | 'signedOut' | 'onboarding' | 'ready';

/** Which part of the app a session may see. Drives the route guards. */
export function statusOf(session: Session | null): Exclude<SessionStatus, 'loading'> {
  if (!session) return 'signedOut';
  if (!session.profile || !session.onboardedAt) return 'onboarding';
  return 'ready';
}

/** The next onboarding screen for a session that is still onboarding. */
export function onboardingStep(session: Session): 'profile' | 'plot' {
  return session.profile ? 'plot' : 'profile';
}

/**
 * Parses what storage returned. Anything unreadable counts as signed out
 * rather than crashing: a corrupt session must never lock a farmer out.
 */
export function parseSession(raw: string | null): Session | null {
  if (!raw) return null;
  try {
    const value = JSON.parse(raw) as Partial<Session>;
    if (typeof value.userId !== 'string' || typeof value.phone !== 'string') return null;
    return value as Session;
  } catch {
    return null;
  }
}
