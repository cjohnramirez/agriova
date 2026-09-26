import { Redirect } from 'expo-router';

import { onboardingStep } from '@/auth/session';
import { useSession } from '@/auth/SessionProvider';

/** Resumes onboarding where the farmer left off, e.g. after closing the app. */
export default function OnboardingStart() {
  const { session } = useSession();
  if (!session) return null;
  return <Redirect href={onboardingStep(session) === 'profile' ? '/profile' : '/plot'} />;
}
