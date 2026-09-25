import type { LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { color, layout, radius } from '@/theme/tokens';

const SIZE = 48;
/** Visual circle is 48 to keep the header light; the hit area is still 56. */
const SLOP = (layout.minTouch - SIZE) / 2;

type IconButtonProps = {
  icon: LucideIcon;
  /** Spoken by screen readers. Required: an icon alone says nothing to them. */
  label: string;
  onPress: () => void;
  /** A dot for unread notifications. */
  badge?: boolean;
};

/** The circular white header button from the prototype (bell, filters, back). */
export function IconButton({ icon: Icon, label, onPress, badge }: IconButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={SLOP}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.circle, pressed && styles.pressed]}
    >
      <Icon size={22} color={color.text} strokeWidth={1.75} />
      {badge ? <View style={styles.badge} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  circle: {
    width: SIZE,
    height: SIZE,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  pressed: { backgroundColor: color.border },
  badge: {
    position: 'absolute',
    top: 10,
    right: 11,
    width: 10,
    height: 10,
    borderRadius: radius.pill,
    backgroundColor: color.danger,
    borderWidth: 2,
    borderColor: color.surface,
  },
});
