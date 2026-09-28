/**
 * The signed-in person, kept on the device. `userId` is the Supabase account
 * id (`auth.uid()`), or a local UUID when no Supabase keys are configured.
 */
export type Profile = {
  name: string;
  /** Free text for now. The pilot is Cagayan de Oro barangays. */
  barangay: string;
};

export type Session = {
  userId: string;
  /** Normalized; see `email.ts`. */
  email: string;
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
    if (typeof value.userId !== 'string' || typeof value.email !== 'string') return null;
    return value as Session;
  } catch {
    return null;
  }
}
