import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ImageBackground, StyleSheet, type ImageSourcePropType } from 'react-native';

import { layout, scrim, space } from '@/theme/tokens';

/** '#123F2E' at 0.72 → 'rgba(18,63,46,0.72)'. */
function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
  return `rgba(${r},${g},${b},${alpha})`;
}

const STRONG = withAlpha(scrim.color, scrim.strong);
const SOFT = withAlpha(scrim.color, scrim.soft);

/**
 * The prototype's signature Home hero: a farm photo edge to edge under a
 * brand-green tint, with white text over it. The tint is strong over the top
 * `scrim.textZone`, where text goes, and fades below so the field shows
 * through behind the cards. Keep text in the top part; put cards below.
 */
export function PhotoHero({
  source,
  children,
}: {
  source: ImageSourcePropType;
  children: ReactNode;
}) {
  return (
    <ImageBackground
      source={source}
      resizeMode="cover"
      style={styles.hero}
      accessibilityIgnoresInvertColors
    >
      <LinearGradient
        colors={[STRONG, STRONG, SOFT]}
        locations={[0, scrim.textZone, 1]}
        style={StyleSheet.absoluteFill}
      />
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  hero: {
    marginHorizontal: layout.bleed,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: space.xl,
    gap: space.lg,
    overflow: 'hidden',
  },
});
