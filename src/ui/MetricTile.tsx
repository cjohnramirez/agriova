import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { color, space } from '@/theme/tokens';
import { Card } from './Card';
import { Text } from './Text';
import { useBreakpoint } from './useBreakpoint';

type MetricTileProps = {
  label: string;
  value: string;
  caption?: string;
  icon?: LucideIcon;
};

/**
 * One number with its name, like the prototype's "Active Fields 12" tiles.
 * Read as a single phrase by screen readers ("Plots, 2, 1.1 ha total").
 */
export function MetricTile({ label, value, caption, icon: Icon }: MetricTileProps) {
  return (
    <Card style={styles.tile}>
      <View
        accessible
        accessibilityLabel={[label, value, caption].filter(Boolean).join(', ')}
        style={styles.inner}
      >
        <View style={styles.head}>
          <Text variant="bodyStrong" style={styles.label}>
            {label}
          </Text>
          {Icon ? <Icon size={22} color={color.accent} strokeWidth={1.75} /> : null}
        </View>
        <Text variant="figure" numeric>
          {value}
        </Text>
        {caption ? <Text tone="muted">{caption}</Text> : null}
      </View>
    </Card>
  );
}

/**
 * Lays tiles out two-up, stacking them on narrow screens and at large text
 * sizes, where two columns would split words mid-way.
 */
export function Tiles({ children }: { children: ReactNode }) {
  const { isNarrow } = useBreakpoint();
  return <View style={[styles.grid, isNarrow && styles.stack]}>{children}</View>;
}

const styles = StyleSheet.create({
  tile: { flex: 1 },
  inner: { gap: space.sm },
  head: { flexDirection: 'row', alignItems: 'flex-start', gap: space.sm },
  label: { flex: 1 },
  grid: { flexDirection: 'row', gap: space.md },
  stack: { flexDirection: 'column' },
});
