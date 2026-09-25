import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { StyleSheet, View, type StyleProp, type ViewStyle } from 'react-native';

import { color, gradient, radius, space, type GradientName } from '@/theme/tokens';

type CardProps = {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
  /** Hero cards get more breathing room. */
  padding?: 'normal' | 'hero';
  /** `none` for a card holding a list of ListRows, which bring their own height. */
  gap?: 'normal' | 'none';
};

/** The white rounded card on the grey background. The basic unit of every screen. */
export function Card({ children, style, padding = 'normal', gap = 'normal' }: CardProps) {
  return (
    <View style={[styles.card, styles[padding], gap === 'none' && styles.flush, style]}>
      {children}
    </View>
  );
}

type GradientCardProps = CardProps & { gradient?: GradientName };

/**
 * The prototype's signature green (or red) card. Runs top-left to bottom-right;
 * keep text in the upper-left three quarters, where contrast is tested.
 */
export function GradientCard({
  children,
  style,
  padding = 'normal',
  gradient: name = 'brand',
}: GradientCardProps) {
  return (
    <LinearGradient
      colors={gradient[name]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={[styles.gradient, styles[padding], style]}
    >
      {children}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: color.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.border,
    gap: space.md,
  },
  gradient: { borderRadius: radius.card, gap: space.md, overflow: 'hidden' },
  normal: { padding: space.lg },
  hero: { padding: space.xl },
  flush: { gap: 0, paddingVertical: space.xs },
});
