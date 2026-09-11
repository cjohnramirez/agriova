import { StyleSheet, Text, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '@/i18n';
import { color, fontSize, fontWeight, layout, radius, space } from '@/theme/tokens';

/**
 * Panimalay. One number dominates: net earnings for the current season. The
 * earlier prototype gave this space to a weather hero and put no earnings
 * figure on the home screen at all.
 */
export default function Home() {
  const { t } = useI18n();

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <LinearGradient
        colors={[color.brandLight, color.brandDark]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.hero}
      >
        <Text style={styles.heroLabel}>{t('homeEarningsLabel')}</Text>
        <Text style={styles.heroFigure}>₱0.00</Text>
        <Text style={styles.heroHint}>{t('homeEarningsEmpty')}</Text>
      </LinearGradient>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.background },
  hero: {
    margin: layout.screenPadding,
    padding: space.xl,
    borderRadius: radius.xl,
    gap: space.sm,
  },
  heroLabel: {
    fontSize: fontSize.body,
    fontWeight: fontWeight.medium,
    color: color.textOnBrand,
    opacity: 0.9,
  },
  heroFigure: {
    fontSize: fontSize.figureHero,
    fontWeight: fontWeight.bold,
    color: color.textOnBrand,
  },
  heroHint: {
    fontSize: fontSize.caption,
    color: color.textOnBrand,
    opacity: 0.8,
  },
});
