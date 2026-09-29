import { ChevronRight, type LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { color, layout, space } from '@/theme/tokens';
import { Text } from './Text';
import { useBreakpoint } from './useBreakpoint';

type ListRowProps = {
  title: string;
  icon?: LucideIcon;
  /** Secondary line under the title. */
  subtitle?: string;
  /** Right-aligned value, e.g. "English" or "₱450.00". */
  value?: string;
  /** Custom right-hand content, replacing value and chevron. */
  trailing?: ReactNode;
  /** Without onPress the row is static and shows no chevron. */
  onPress?: () => void;
  tone?: 'default' | 'danger';
};

/** A settings-style row: icon, label, value, chevron. Used inside a Card. */
export function ListRow({
  title,
  icon: Icon,
  subtitle,
  value,
  trailing,
  onPress,
  tone = 'default',
}: ListRowProps) {
  const fg = tone === 'danger' ? color.danger : color.text;
  // On a narrow screen or with large text, a value beside the title squeezes it
  // until it breaks mid-word ("Languag/e"). Stack it under the title instead.
  const { isNarrow } = useBreakpoint();
  const stackValue = isNarrow && !!value && !trailing;

  const content = (
    <>
      {Icon ? <Icon size={22} color={fg} /> : null}
      <View style={styles.text}>
        <Text variant="bodyStrong" style={{ color: fg }}>
          {title}
        </Text>
        {subtitle ? <Text tone="muted">{subtitle}</Text> : null}
        {stackValue ? (
          <Text tone="muted" numeric>
            {value}
          </Text>
        ) : null}
      </View>
      {trailing ?? (
        <>
          {value && !stackValue ? (
            <Text tone="muted" numeric>
              {value}
            </Text>
          ) : null}
          {onPress ? <ChevronRight size={22} color={color.textFaint} /> : null}
        </>
      )}
    </>
  );

  if (!onPress) return <View style={styles.row}>{content}</View>;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={value ? `${title}, ${value}` : title}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // Vertical padding plus the flush card's own padding makes a row's text
  // sit as far from the card edge above and below as it does at the sides.
  row: {
    minHeight: layout.minTouch,
    paddingVertical: space.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  text: { flex: 1, gap: space.xs },
  pressed: { opacity: 0.6 },
});
