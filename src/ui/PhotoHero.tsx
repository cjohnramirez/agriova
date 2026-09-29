import type { ReactNode } from 'react';
import { ImageBackground, StyleSheet, View, type ImageSourcePropType } from 'react-native';

import { layout, photoOverlay, space } from '@/theme/tokens';

/**
 * The prototype's Home hero: a photo edge to edge right under the top bar,
 * with a flat black tint so white text reads over it.
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
      <View style={[StyleSheet.absoluteFill, styles.tint]} />
      {children}
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  hero: {
    // Out to the screen edges and up against the top bar, as in the frame.
    marginHorizontal: layout.bleed,
    marginTop: -space.lg,
    paddingTop: space.xxl,
    paddingBottom: space.xl,
    gap: space.md,
    overflow: 'hidden',
  },
  tint: { backgroundColor: photoOverlay },
});
