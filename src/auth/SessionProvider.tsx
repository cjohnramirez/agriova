import { randomUUID } from 'expo-crypto';
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

import { resetLocalData } from '@/db/client';
import { parseSession, statusOf, type Profile, type Session, type SessionStatus } from './session';

const STORAGE_KEY = 'agriova.session.v1';

type SessionValue = {
  status: SessionStatus;
  session: Session | null;
  /**
   * Called after the code is confirmed. Until Supabase auth lands in step 7
   * the code is not checked and the user id is a local UUID.
   */
  signIn: (phone: string) => Promise<void>;
  saveProfile: (profile: Profile) => Promise<void>;
  finishOnboarding: () => Promise<void>;
  /** Signs out and wipes local records, so the next person starts clean. */
  signOut: () => Promise<void>;
};

const SessionContext = createContext<SessionValue | null>(null);

/**
 * Holds the signed-in person and keeps them in the device's secure storage,
 * so a restart, a rotation or the OS killing the app does not log them out.
 */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((raw) => setSession(parseSession(raw)))
      .catch(() => setSession(null))
      .finally(() => setLoaded(true));
  }, []);

  const persist = useCallback(async (next: Session | null) => {
    setSession(next);
    if (next) await SecureStore.setItemAsync(STORAGE_KEY, JSON.stringify(next));
    else await SecureStore.deleteItemAsync(STORAGE_KEY);
  }, []);

  const signIn = useCallback(
    (phone: string) => persist({ userId: randomUUID(), phone }),
    [persist],
  );

  const saveProfile = useCallback(
    async (profile: Profile) => {
      if (session) await persist({ ...session, profile });
    },
    [persist, session],
  );

  const finishOnboarding = useCallback(async () => {
    if (session) await persist({ ...session, onboardedAt: Date.now() });
  }, [persist, session]);

  const signOut = useCallback(async () => {
    await resetLocalData();
    await persist(null);
  }, [persist]);

  const value = useMemo<SessionValue>(
    () => ({
      status: loaded ? statusOf(session) : 'loading',
      session,
      signIn,
      saveProfile,
      finishOnboarding,
      signOut,
    }),
    [loaded, session, signIn, saveProfile, finishOnboarding, signOut],
  );

  return <SessionContext.Provider value={value}>{children}</SessionContext.Provider>;
}

export function useSession(): SessionValue {
  const value = useContext(SessionContext);
  if (!value) throw new Error('useSession must be used inside SessionProvider');
  return value;
}
