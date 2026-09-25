import { Link } from 'expo-router';
import { StyleSheet, View } from 'react-native';

import { useI18n } from '@/i18n';
import { color, layout, space } from '@/theme/tokens';
import { Logo, Text } from '@/ui';

/**
 * Placeholder while the frontend is rebuilt from the design system up. It keeps
 * the app bootable, so the database gate and migrations can be checked on a
 * device before any real screen exists. In development it links to the
 * component gallery.
 */
export default function Index() {
  const { t } = useI18n();

  return (
    <View style={styles.screen}>
      <Logo variant="wordmark" height={48} />
      <Text tone="muted">{t('comingSoon')}</Text>
      {__DEV__ ? (
        <Link href="/gallery" style={styles.link}>
          <Text variant="bodyStrong" tone="accent">
            Component gallery
          </Text>
        </Link>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.lg,
    padding: layout.screenPadding,
    backgroundColor: color.background,
  },
  link: { padding: space.lg },
});
