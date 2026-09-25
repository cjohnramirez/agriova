import { UserRound } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { color, layout, radius, space } from '@/theme/tokens';
import { Text } from './Text';

type TopBarProps = {
  /** Small line above the name, e.g. "Welcome back". */
  greeting: string;
  name: string;
  /** Opens Settings. */
  onPressAvatar: () => void;
  avatarLabel: string;
  /** Right-hand IconButtons, e.g. notifications. */
  actions?: ReactNode;
};

/** The "Welcome Back / name + bell" bar that heads every tab in the prototype. */
export function TopBar({ greeting, name, onPressAvatar, avatarLabel, actions }: TopBarProps) {
  return (
    <View style={styles.bar}>
      <Pressable
        onPress={onPressAvatar}
        accessibilityRole="button"
        accessibilityLabel={avatarLabel}
        style={styles.who}
      >
        <View style={styles.avatar}>
          <UserRound size={24} color={color.text} strokeWidth={1.75} />
        </View>
        <View style={styles.names}>
          <Text variant="label" tone="muted" numberOfLines={1}>
            {greeting}
          </Text>
          <Text variant="bodyStrong" numberOfLines={1}>
            {name}
          </Text>
        </View>
      </Pressable>
      <View style={styles.actions}>{actions}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    paddingHorizontal: layout.screenPadding,
    paddingVertical: space.sm,
    backgroundColor: color.background,
  },
  who: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
    minHeight: layout.minTouch,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  names: { flex: 1 },
  actions: { flexDirection: 'row', gap: space.sm },
});
