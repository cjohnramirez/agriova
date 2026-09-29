import { Check } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet } from 'react-native';

import { color, layout, radius, space } from '@/theme/tokens';
import { Text } from './Text';

const HEIGHT = 44;
const SLOP = (layout.minTouch - HEIGHT) / 2;

type Option<K extends string> = { key: K; label: string };

type FilterPillsProps<K extends string> = {
  options: readonly Option<K>[];
  selected: K;
  onSelect: (key: K) => void;
  /** Read by screen readers before the options, e.g. "Filter by type". */
  label: string;
};

/**
 * A horizontal row of single-select pills ("All", "Seeds", "Fertilizers").
 * Selection shows as a filled pill AND a check mark, so it never relies on
 * color alone.
 */
export function FilterPills<K extends string>({
  options,
  selected,
  onSelect,
  label,
}: FilterPillsProps<K>) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      accessibilityRole="radiogroup"
      accessibilityLabel={label}
      contentContainerStyle={styles.row}
    >
      {options.map((option) => {
        const isOn = option.key === selected;
        return (
          <Pressable
            key={option.key}
            onPress={() => onSelect(option.key)}
            hitSlop={{ top: SLOP, bottom: SLOP }}
            accessibilityRole="radio"
            accessibilityState={{ selected: isOn, checked: isOn }}
            accessibilityLabel={option.label}
            style={({ pressed }) => [
              styles.pill,
              isOn ? styles.on : styles.off,
              pressed && !isOn && styles.pressed,
            ]}
          >
            {isOn ? <Check size={18} color={color.textOnBrand} /> : null}
            <Text variant="label" tone={isOn ? 'onBrand' : 'default'}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.sm, paddingVertical: SLOP },
  pill: {
    minHeight: HEIGHT,
    minWidth: HEIGHT,
    paddingHorizontal: space.lg,
    borderRadius: radius.pill,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: space.xs,
  },
  on: { backgroundColor: color.accent },
  off: { backgroundColor: color.surface, borderWidth: 1, borderColor: color.border },
  pressed: { backgroundColor: color.border },
});
