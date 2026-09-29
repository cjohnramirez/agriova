import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { useI18n } from '@/i18n';
import { color } from '@/theme/tokens';

/**
 * iOS only: the system tab bar, which iOS 26 draws in Liquid Glass. Android
 * (and older iOS) keeps the custom bar in `_layout.tsx`, drawn to the Figma
 * frame; here the platform's own look wins, as a nod to the platform.
 *
 * Nothing forces the bar opaque, so content scrolls under the glass. The
 * icons are the same hairline Lucide icons as Android's bar, rendered to PNG by
 * `npm run gen:tab-icons` and tinted by iOS like its own symbols.
 */
const ICONS = {
  home: require('../../assets/tab-icons/home.png'),
  fields: require('../../assets/tab-icons/fields.png'),
  activity: require('../../assets/tab-icons/activity.png'),
  assistant: require('../../assets/tab-icons/assistant.png'),
  shop: require('../../assets/tab-icons/shop.png'),
};

export default function TabsLayout() {
  const { t } = useI18n();

  return (
    <NativeTabs
      tintColor={color.accent}
      iconColor={{ default: color.text, selected: color.accent }}
      labelStyle={{ default: { color: color.text }, selected: { color: color.accent } }}
      minimizeBehavior="never"
    >
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>{t('tabHome')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={ICONS.home} renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="fields">
        <NativeTabs.Trigger.Label>{t('tabFields')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={ICONS.fields} renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="activity">
        <NativeTabs.Trigger.Label>{t('tabActivity')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={ICONS.activity} renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="assistant">
        <NativeTabs.Trigger.Label>{t('tabAssistant')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={ICONS.assistant} renderingMode="template" />
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="shop">
        <NativeTabs.Trigger.Label>{t('tabShop')}</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon src={ICONS.shop} renderingMode="template" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
