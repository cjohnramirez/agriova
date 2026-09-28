import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  useFonts,
} from '@expo-google-fonts/geist';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { SessionProvider, useSession } from '@/auth/SessionProvider';
import { DatabaseGate } from '@/db/DatabaseGate';
import { I18nProvider } from '@/i18n';
import { SyncProvider } from '@/sync/SyncProvider';
import { color } from '@/theme/tokens';

// The native splash stays up until fonts, the database and the stored session
// are all ready, so the farmer never sees a blank frame or the wrong screen.
SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
  });
  if (!fontsLoaded && !fontError) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nProvider>
          <StatusBar style="dark" />
          <DatabaseGate>
            <SessionProvider>
              <RootStack />
            </SessionProvider>
          </DatabaseGate>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Three areas, each behind a guard. Expo Router sends the farmer to the first
 * screen they are allowed to see, so there is no redirect logic in screens:
 * signing in or finishing onboarding just changes the session.
 */
function RootStack() {
  const { status } = useSession();

  useEffect(() => {
    if (status !== 'loading') SplashScreen.hideAsync().catch(() => {});
  }, [status]);

  if (status === 'loading') return null;

  return (
    <SyncProvider signedIn={status === 'ready'}>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: color.background },
        }}
      >
        <Stack.Protected guard={status === 'signedOut'}>
          <Stack.Screen name="(auth)" />
        </Stack.Protected>

        <Stack.Protected guard={status === 'onboarding'}>
          <Stack.Screen name="(onboarding)" />
        </Stack.Protected>

        <Stack.Protected guard={status === 'ready'}>
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="settings" />
          <Stack.Screen name="notifications" />
          <Stack.Screen name="statistics" />
          <Stack.Screen name="plot/new" />
          <Stack.Screen name="plot/[id]" />
          <Stack.Screen
            name="record/index"
            options={{
              presentation: 'formSheet',
              sheetAllowedDetents: 'fitToContents',
              sheetGrabberVisible: true,
              sheetCornerRadius: 24,
              contentStyle: { backgroundColor: color.background },
            }}
          />
          <Stack.Screen name="record/[kind]" />
        </Stack.Protected>

        <Stack.Protected guard={__DEV__}>
          <Stack.Screen name="gallery" />
        </Stack.Protected>
      </Stack>
    </SyncProvider>
  );
}
