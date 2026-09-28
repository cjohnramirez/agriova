import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { authBackend, type AuthBackend } from '@/backend/auth';
import { supabase } from '@/backend/supabase';
import { resetLocalData } from '@/db/client';
import { parseSession, statusOf, type Profile, type Session, type SessionStatus } from './session';

const STORAGE_KEY = 'agriova.session.v1';

type SessionValue = {
  status: SessionStatus;
  session: Session | null;
  /** Emails the code. Rejects with `AuthError` when it cannot be sent. */
  sendCode: (email: string) => Promise<void>;
  /**
   * Checks the code and signs in. A returning farmer's profile comes back from
   * the server, so they skip onboarding and sync restores their farm.
   */
  verifyCode: (email: string, code: string) => Promise<void>;
  saveProfile: (profile: Profile) => Promise<void>;
  finishOnboarding: () => Promise<void>;
  /** Signs out and wipes local records, so the next person starts clean. */
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

/**
 * Holds the signed-in person and keeps them in the device's secure storage,
 * so a restart, a rotation or the OS killing the app does not log them out.
 * Supabase keeps its own token separately; this is the app's view of who is
 * here and how far through onboarding they are.
 */
export function SessionProvider({
  children,
  backend = authBackend,
}: {
  children: ReactNode;
  backend?: AuthBackend;
}) {
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);

  const persist = useCallback(async (next: Session | null) => {
    setSession(next);
    if (next) await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
    else await SecureStore.deleteItemAsync(STORAGE_KEY);
  }, []);

  useEffect(() => {
    (async () => {
      let stored = parseSession(await SecureStore.getItemAsync(STORAGE_KEY).catch(() => null));
      // A session saved without a server account (from before sign-in was
      // real, or after the token was revoked) cannot sync. Start over rather
      // than let the farmer record into a ledger that will never back up.
      if (stored && supabase) {
        const { data } = await supabase.auth.getSession();
        if (data.session?.user.id !== stored.userId) {
          await resetLocalData();
          await SecureStore.deleteItemAsync(STORAGE_KEY);
          stored = null;
        }
      }
      setSession(stored);
    })()
      .catch(() => setSession(null))
      .finally(() => setLoaded(true));
  }, []);

  const sendCode = useCallback((email: string) => backend.sendCode(email), [backend]);

  const verifyCode = useCallback(
    async (email: string, code: string) => {
      const { userId } = await backend.verifyCode(email, code);
      // No signal after the code went through: onboarding asks again and the
      // profile is saved then, which is better than blocking sign-in.
      const profile = await backend.fetchProfile(userId).catch(() => null);
      await persist({
        userId,
        email,
        ...(profile ? { profile, onboardedAt: Date.now() } : {}),
      });
    },
    [backend, persist],
  );

  const saveProfile = useCallback(
    async (profile: Profile) => {
      if (!session) return;
      await persist({ ...session, profile });
      // Best effort: onboarding must work in a field with no signal.
      await backend.saveProfile(session.userId, profile).catch(() => {});
    },
    [backend, persist, session],
  );

  const finishOnboarding = useCallback(async () => {
    if (session) await persist({ ...session, onboardedAt: Date.now() });
  }, [persist, session]);

  const signOut = useCallback(async () => {
    await backend.signOut().catch(() => {});
    await resetLocalData();
    await persist(null);
  }, [backend, persist]);

  const value = useMemo<SessionValue>(
    () => ({
      status: loaded ? statusOf(session) : 'loading',
      session,
      sendCode,
      verifyCode,
      saveProfile,
      finishOnboarding,
      signOut,
    }),
    [loaded, session, sendCode, verifyCode, saveProfile, finishOnboarding, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}

/**
 * The signed-in farmer's id, for scoping queries. Empty for the moment between
 * signing out and the guard leaving the screen, so queries return nothing
 * instead of the screen throwing mid-transition.
 */
export function useOwnerId(): string {
  return useSession().session?.userId ?? '';
}
