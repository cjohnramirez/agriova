import { Check } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { color, layout, radius, space } from '@/theme/tokens';
import { Text } from './Text';

type ChoicePillsProps<K extends string> = {
  options: readonly { key: K; label: string }[];
  /** Null until the farmer picks: a form should not guess a category for them. */
  selected: K | null;
  onSelect: (key: K) => void;
  /** Read by screen readers before the options, e.g. "Spent on". */
  label: string;
};

/**
 * A single-select answer inside a form, e.g. what an expense was for. Unlike
 * `FilterPills`, every option stays visible: the pills wrap onto new lines
 * instead of scrolling sideways, because a choice hidden off-screen is a
 * choice a first-time user never sees. Full 56dp height and body-size text,
 * since here the label is the answer, not a filter.
 */
export function ChoicePills<K extends string>({
  options,
  selected,
  onSelect,
  label,
}: ChoicePillsProps<K>) {
  return (
    <View accessibilityRole="radiogroup" accessibilityLabel={label} style={styles.wrap}>
      {options.map((option) => {
        const isOn = option.key === selected;
        return (
          <Pressable
            key={option.key}
            onPress={() => onSelect(option.key)}
            accessibilityRole="radio"
            accessibilityState={{ selected: isOn, checked: isOn }}
            accessibilityLabel={option.label}
            style={({ pressed }) => [
              styles.pill,
              isOn ? styles.on : styles.off,
              pressed && !isOn && styles.pressed,
            ]}
          >
            {isOn ? <Check size={20} color={color.textOnBrand} /> : null}
            <Text variant="bodyStrong" tone={isOn ? 'onBrand' : 'default'}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  pill: {
    minHeight: layout.minTouch,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.xs,
  },
  on: { backgroundColor: color.accent },
  off: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  pressed: { backgroundColor: color.border },
});
