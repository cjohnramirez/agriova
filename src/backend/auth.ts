import type { SupabaseClient } from '@supabase/supabase-js';
import { randomUUID } from 'expo-crypto';

import type { Profile } from '@/auth/session';

import { supabase } from './supabase';

/**
 * Sign-in as the app sees it. Two implementations: Supabase email OTP, and a
 * local stand-in for when no Supabase keys are configured.
 */
export interface AuthBackend {
  /** True when records leave the phone. False for the local stand-in. */
  readonly online: boolean;
  /**
   * Emails a 6-digit code. Creates the account on first use, so there is no
   * separate sign-up.
   */
  sendCode(email: string): Promise<void>;
  /** Checks the code. Resolves with the account id, rejects if it is wrong. */
  verifyCode(email: string, code: string): Promise<{ userId: string }>;
  /** The farmer's saved profile, so a returning farmer skips onboarding. */
  fetchProfile(userId: string): Promise<Profile | null>;
  saveProfile(userId: string, profile: Profile): Promise<void>;
  signOut(): Promise<void>;
}

/** Why a sign-in step failed, in the terms the screen shows. */
export class AuthError extends Error {
  constructor(readonly reason: 'wrongCode' | 'network') {
    super(reason);
  }
}

function onlineBackend(client: SupabaseClient): AuthBackend {
  return {
    online: true,

    async sendCode(email) {
      const { error } = await client.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: true },
      });
      if (error) throw new AuthError('network');
    },

    async verifyCode(email, code) {
      const { data, error } = await client.auth.verifyOtp({ email, token: code, type: 'email' });
      if (error || !data.user) {
        // Expired and wrong codes come back as 4xx; anything else is the connection.
        throw new AuthError(error?.status && error.status < 500 ? 'wrongCode' : 'network');
      }
      return { userId: data.user.id };
    },

    async fetchProfile(userId) {
      const { data, error } = await client
        .from('profile')
        .select('name, barangay')
        .eq('id', userId)
        .maybeSingle();
      if (error) throw new AuthError('network');
      return data;
    },

    async saveProfile(userId, profile) {
      const { error } = await client
        .from('profile')
        .upsert({ id: userId, ...profile, updated_at: Date.now() });
      if (error) throw new AuthError('network');
    },

    async signOut() {
      // Local sign-out still clears the phone if the server cannot be reached.
      await client.auth.signOut({ scope: 'local' });
    },
  };
}

/**
 * No keys configured: any valid code signs in, the account id is made up on
 * the phone, and nothing syncs. Keeps tests, CI and fresh clones working.
 */
const local: AuthBackend = {
  online: false,
  async sendCode() {},
  async verifyCode() {
    return { userId: randomUUID() };
  },
  async fetchProfile() {
    return null;
  },
  async saveProfile() {},
  async signOut() {},
};

export const authBackend: AuthBackend = supabase ? onlineBackend(supabase) : local;
