import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { Platform } from 'react-native';

import { useI18n } from '@/i18n';
import { color } from '@/theme/tokens';

/**
 * The prototype's five tabs on the platform's own tab bar: UIKit on iOS,
 * Material on Android. Native buys correct haptics, scroll-to-top and screen
 * reader support for free.
 *
 * Two deliberate departures from the Material defaults, both found on the
 * emulator: every tab shows its label (icons alone are ambiguous to a
 * first-time user), and the selected pill is brand green, not Material lavender.
 * `disableTransparentOnScrollEdge` keeps labels legible in bright sun.
 */
export default function TabsLayout() {
  const { t } = useI18n();
  const android = Platform.OS === 'android';

  return (
    <NativeTabs
      tintColor={color.accent}
      iconColor={{ default: color.textMuted, selected: color.accent }}
      labelStyle={{ default: { color: color.textMuted }, selected: { color: color.accent } }}
      backgroundColor={android ? color.surface : undefined}
      indicatorColor={android ? color.accentSoft : undefined}
      labelVisibilityMode={android ? 'labeled' : undefined}
      blurEffect={android ? undefined : 'systemChromeMaterial'}
      disableTransparentOnScrollEdge
      minimizeBehavior="never"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('tabHome')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house" md="home" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="fields">
        <NativeTabs.Trigger.Label>{t('tabFields')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="map" md="map" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="activity">
        <NativeTabs.Trigger.Label>{t('tabActivity')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="list.bullet" md="event_note" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="assistant">
        <NativeTabs.Trigger.Label>{t('tabAssistant')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bubble.left.and.text.bubble.right" md="forum" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="shop">
        <NativeTabs.Trigger.Label>{t('tabShop')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="bag" md="shopping_bag" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
