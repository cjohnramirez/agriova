import { Platform } from 'react-native';
import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useI18n } from '@/i18n';
import { color } from '@/theme/tokens';

/**
 * Native tab bar on both platforms. On iOS 26 this is the real UIKit Liquid
 * Glass tab bar; on older iOS it degrades to the standard translucent bar, and
 * on Android it is a native Material bottom bar. Using the platform's own
 * component also buys correct haptics, scroll-to-top, and accessibility that a
 * JavaScript tab bar has to reimplement badly.
 *
 * Icons here are SF Symbols on iOS and Material names on Android, because a
 * native tab bar cannot host an arbitrary React component. Lucide is used for
 * every other icon in the app.
 *
 * `disableTransparentOnScrollEdge` keeps labels legible when content scrolls
 * underneath, which matters more than the effect: the target user is outdoors
 * in bright sun.
 */
export default function TabsLayout() {
  const { t } = useI18n();

  return (
    <NativeTabs
      tintColor={color.accent}
      backgroundColor={Platform.OS === 'android' ? color.surface : undefined}
      blurEffect={Platform.OS === 'ios' ? 'systemChromeMaterial' : undefined}
      disableTransparentOnScrollEdge
      minimizeBehavior="never"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('tabHome')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="house" md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="uma">
        <NativeTabs.Trigger.Label>{t('tabFarm')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="leaf" md="eco" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="tindahan">
        <NativeTabs.Trigger.Label>{t('tabMarket')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="tag" md="sell" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="ako">
        <NativeTabs.Trigger.Label>{t('tabMe')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon sf="person" md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
