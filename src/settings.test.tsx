/**
 * Settings, About and Help. Account deletion is a store requirement, so its
 * two outcomes are checked: deleted, and refused without signal.
 */
import { act, fireEvent, screen, waitFor } from '@testing-library/react-native';
import { Alert, Linking, type AlertButton } from 'react-native';

import About from '../app/about';
import Help from '../app/help';
import Settings from '../app/settings';
import { PRIVACY_POLICY_URL, SUPPORT_EMAIL } from '@/links';
import { renderScreen } from '@/testing/renderScreen';

const mockRouter = { push: jest.fn(), back: jest.fn() };
const mockDeleteAccount = jest.fn();

jest.mock('@/backend/supabase', () => ({ supabase: null }));
jest.mock('@/db/client', () => ({ deviceRunner: null }));
jest.mock('@/sync/SyncProvider', () => ({ useSync: () => ({ syncNow: jest.fn() }) }));
jest.mock('expo-router', () => ({ useRouter: () => mockRouter }));
jest.mock('@/auth/SessionProvider', () => ({
  useSession: () => ({
    session: { userId: 'owner-1', email: 'nena@example.com', profile: { name: 'Nena' } },
    signOut: jest.fn(),
    deleteAccount: mockDeleteAccount,
  }),
}));
jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

/** Presses the destructive button of the confirmation that just opened. */
async function confirmAlert(alert: jest.SpyInstance) {
  const buttons = alert.mock.calls.at(-1)?.[2] as AlertButton[];
  await act(async () => buttons.find((b) => b.style === 'destructive')?.onPress?.());
}

let alert: jest.SpyInstance;
beforeEach(() => {
  jest.clearAllMocks();
  alert = jest.spyOn(Alert, 'alert').mockImplementation(() => {});
});

describe('Deleting the account', () => {
  it('asks first, then deletes', async () => {
    mockDeleteAccount.mockResolvedValue(undefined);
    await renderScreen(<Settings />, { farm: false });
    await fireEvent.press(screen.getByText('Delete my account'));
    expect(mockDeleteAccount).not.toHaveBeenCalled();

    await confirmAlert(alert);
    await waitFor(() => expect(mockDeleteAccount).toHaveBeenCalledTimes(1));
  });

  it('says so and keeps the farmer here when it fails', async () => {
    mockDeleteAccount.mockRejectedValue(new Error('network'));
    await renderScreen(<Settings />, { farm: false });
    await fireEvent.press(screen.getByText('Delete my account'));
    await confirmAlert(alert);

    await waitFor(() =>
      expect(alert).toHaveBeenLastCalledWith(
        '',
        'Your account could not be deleted. Check that you have signal, then try again.',
      ),
    );
    // The row works again for another try.
    expect(screen.queryByText('Deleting your account…')).toBeNull();
  });

  it('opens Help and About', async () => {
    await renderScreen(<Settings />, { farm: false });
    await fireEvent.press(screen.getByText('Help center'));
    await fireEvent.press(screen.getByText('About Agriova'));
    expect(mockRouter.push.mock.calls).toEqual([['/help'], ['/about']]);
  });
});

describe('About', () => {
  it('links the privacy policy and credits the weather', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await renderScreen(<About />, { farm: false });
    await fireEvent.press(screen.getByText('Privacy policy'));
    expect(open).toHaveBeenCalledWith(PRIVACY_POLICY_URL);
    expect(screen.getByText('Weather data by Open-Meteo.com (CC BY 4.0)')).toBeOnTheScreen();
  });
});

describe('Help', () => {
  it('answers the first questions', async () => {
    await renderScreen(<Help />, { farm: false });
    expect(screen.getByText('Does it work without signal?')).toBeOnTheScreen();
  });

  it('opens an email to support', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await renderScreen(<Help />, { farm: false });
    await fireEvent.press(screen.getByText('Email us'));
    expect(open).toHaveBeenCalledWith(`mailto:${SUPPORT_EMAIL}`);
  });
});
