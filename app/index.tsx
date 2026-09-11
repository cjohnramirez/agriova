import { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Redirect } from 'expo-router';

import { useI18n } from '@/i18n';
import { color, fontSize, fontWeight, space } from '@/theme/tokens';

/**
 * Splash. Once auth exists this is where the stored session is checked and the
 * user is sent to the tabs or to login. For now it always lands on login.
 */
export default function Splash() {
  const { t } = useI18n();
  const [done, setDone] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setDone(true), 1200);
    return () => clearTimeout(timer);
  }, []);

  if (done) return <Redirect href="/login" />;

  return (
    <View style={styles.container}>
      <View style={styles.mark}>
        <Text style={styles.markLetter}>A</Text>
      </View>
      <Text style={styles.name}>{t('appName')}</Text>
      <Text style={styles.tagline}>{t('tagline')}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.brand,
    gap: space.md,
  },
  mark: {
    width: 96,
    height: 96,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: color.surface,
    marginBottom: space.sm,
  },
  markLetter: {
    fontSize: 56,
    fontWeight: fontWeight.bold,
    color: color.brand,
  },
  name: {
    fontSize: fontSize.heading,
    fontWeight: fontWeight.bold,
    color: color.textOnBrand,
    letterSpacing: 0.5,
  },
  tagline: {
    fontSize: fontSize.body,
    color: color.textOnBrand,
    opacity: 0.85,
  },
});
