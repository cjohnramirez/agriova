import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { I18nProvider } from '@/i18n';
import { color } from '@/theme/tokens';

export default function RootLayout() {
  return (
    // GestureHandlerRootView must wrap everything for the add sheet to work.
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <I18nProvider>
          <StatusBar style="dark" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: color.background },
            }}
          />
        </I18nProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
