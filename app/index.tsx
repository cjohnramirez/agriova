import { StyleSheet, Text, View } from 'react-native';

import { useI18n } from '@/i18n';
import { color, fontSize, fontWeight, layout, space } from '@/theme/tokens';

/**
 * Placeholder while the frontend is rebuilt from the design system up. It keeps
 * the app bootable, so the database gate and migrations can be checked on a
 * device before any real screen exists.
 */
export default function Index() {
  const { t } = useI18n();

  return (
    <View style={styles.screen}>
      <Text style={styles.name}>{t('appName')}</Text>
      <Text style={styles.status}>{t('comingSoon')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.sm,
    padding: layout.screenPadding,
    backgroundColor: color.background,
  },
  name: {
    fontSize: fontSize.heading,
    fontWeight: fontWeight.bold,
    color: color.text,
  },
  status: {
    fontSize: fontSize.body,
    color: color.textMuted,
  },
});
