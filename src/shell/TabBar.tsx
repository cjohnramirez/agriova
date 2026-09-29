import type { BottomTabBarProps } from 'expo-router/js-tabs';
import {
  BotMessageSquare,
  House,
  Map,
  ShoppingBag,
  TextAlignCenter,
  type LucideIcon,
} from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, layout, space } from '@/theme/tokens';
import { Text } from '@/ui';

/** The prototype's tab icons, Lucide at hairline weight like the rest. */
const ICONS: Record<string, LucideIcon> = {
  index: House,
  fields: Map,
  activity: TextAlignCenter,
  assistant: BotMessageSquare,
  shop: ShoppingBag,
};

/**
 * The prototype's bottom bar: white, a hairline on top, five equal items of a
 * 24dp icon over its label. The current tab is accent green, the rest black;
 * no pill, no shadow. Built here rather than taking the platform's bar, whose
 * Material pill and heavier icons looked nothing like the design.
 */
export function TabBar({ state, descriptors, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom + space.lg }]}>
      {state.routes.map((route, index) => {
        const focused = state.index === index;
        const { options } = descriptors[route.key];
        const label = String(options.title ?? route.name);
        const Icon = ICONS[route.name] ?? House;
        const tint = focused ? color.accent : color.text;

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
            canPreventDefault: true,
          });
          if (!focused && !event.defaultPrevented) navigation.navigate(route.name, route.params);
        };

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            accessibilityRole="tab"
            accessibilityState={{ selected: focused }}
            accessibilityLabel={label}
            style={({ pressed }) => [styles.item, pressed && styles.pressed]}
          >
            <Icon size={24} color={tint} />
            <Text
              variant="label"
              numberOfLines={1}
              maxFontSizeMultiplier={1.2}
              style={{ color: tint }}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: color.surface,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: color.border,
    // Roomy like the prototype's 90dp bar, so the row sits clear of the gesture area.
    paddingTop: space.lg,
    paddingHorizontal: space.sm,
  },
  item: {
    flex: 1,
    minHeight: layout.minTouch,
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
  pressed: { opacity: 0.6 },
});
