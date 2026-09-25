import {
  Geist_400Regular,
  Geist_500Medium,
  Geist_600SemiBold,
  Geist_700Bold,
  useFonts,
} from '@expo-google-fonts/geist';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DatabaseGate } from '@/db/DatabaseGate';
import { I18nProvider } from '@/i18n';
import { color } from '@/theme/tokens';

export default function RootLayout() {
  // Local files, so this resolves in milliseconds. Rendering before it would
  // flash the system font and reflow every line once Geist arrives.
  const [fontsLoaded, fontError] = useFonts({
    Geist_400Regular,
    Geist_500Medium,
    Geist_600SemiBold,
    Geist_700Bold,
  });
  if (!fontsLoaded && !fontError) return null;

  return (
    // GestureHandlerRootView must wrap everything for the add sheet to work.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nProvider>
          <StatusBar style="dark" />
          <DatabaseGate>
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { backgroundColor: color.background },
              }}
            />
          </DatabaseGate>
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
