import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { color, layout, radius, space } from '@/theme/tokens';
import { Text } from './Text';

const variants = {
  /** The one main action on a screen. Solid green. */
  primary: { bg: color.action, pressed: color.actionPressed, fg: color.textOnBrand, border: null },
  /** Secondary actions on the grey background, e.g. "Add Task". */
  secondary: { bg: color.surface, pressed: color.border, fg: color.text, border: color.border },
  /** On a gradient card, e.g. "Reschedule Now". White, text takes the card's color. */
  onCard: { bg: color.surface, pressed: color.border, fg: color.danger, border: null },
} as const;

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: keyof typeof variants;
  icon?: LucideIcon;
  /** Overrides the text color, e.g. green on an approval card. */
  tint?: string;
  disabled?: boolean;
  accessibilityHint?: string;
  /** Stretch to the parent's width rather than hugging the label. */
  block?: boolean;
};

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon: Icon,
  tint,
  disabled,
  accessibilityHint,
  block,
}: ButtonProps) {
  const v = variants[variant];
  const fg = tint ?? v.fg;

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityHint={accessibilityHint}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        styles.base,
        block && styles.block,
        { backgroundColor: pressed ? v.pressed : v.bg },
        v.border && { borderWidth: 1, borderColor: v.border },
        disabled && styles.disabled,
      ]}
    >
      <View style={styles.row}>
        {Icon ? <Icon size={22} color={fg} strokeWidth={2} /> : null}
        <Text variant="bodyStrong" style={{ color: fg }}>
          {label}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    minHeight: layout.minTouch,
    paddingHorizontal: space.xl,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  block: { alignSelf: 'stretch' },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  disabled: { opacity: 0.45 },
});
