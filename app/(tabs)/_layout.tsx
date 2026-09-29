import { Tabs } from 'expo-router/js-tabs';

import { useI18n } from '@/i18n';
import { TabBar } from '@/shell/TabBar';
import { color } from '@/theme/tokens';

/**
 * The prototype's five tabs, drawn by `TabBar` to match the design exactly.
 * Each tab screen brings its own header (the TopBar), so the navigator's is off.
 */
export default function TabsLayout() {
  const { t } = useI18n();

  return (
    <Tabs
      tabBar={(props) => <TabBar {...props} />}
      screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: color.background } }}
    >
      <Tabs.Screen name="index" options={{ title: t('tabHome') }} />
      <Tabs.Screen name="fields" options={{ title: t('tabFields') }} />
      <Tabs.Screen name="activity" options={{ title: t('tabActivity') }} />
      <Tabs.Screen name="assistant" options={{ title: t('tabAssistant') }} />
      <Tabs.Screen name="shop" options={{ title: t('tabShop') }} />
    </Tabs>
  );
}
