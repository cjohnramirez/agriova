import { Check, ChevronRight, type LucideIcon } from 'lucide-react-native';
import { Pressable, StyleSheet, View } from 'react-native';

import { color, layout, radius, space } from '@/theme/tokens';
import { Text } from './Text';

type ChoiceCardProps = {
  title: string;
  hint?: string;
  icon?: LucideIcon;
  onPress: () => void;
  /** For single-choice lists such as language. Omit for plain navigation. */
  selected?: boolean;
};

/**
 * A large tappable option: an icon tile, a title and one line of explanation.
 * Used where a farmer makes one clear choice, like "Expense / Harvest / Sale".
 */
export function ChoiceCard({ title, hint, icon: Icon, onPress, selected }: ChoiceCardProps) {
  const isChoice = selected !== undefined;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={isChoice ? 'radio' : 'button'}
      accessibilityState={isChoice ? { selected, checked: selected } : undefined}
      accessibilityLabel={hint ? `${title}. ${hint}` : title}
      style={({ pressed }) => [styles.card, selected && styles.selected, pressed && styles.pressed]}
    >
      {Icon ? (
        <View style={styles.tile}>
          <Icon size={28} color={color.accent} strokeWidth={1.75} />
        </View>
      ) : null}
      <View style={styles.text}>
        <Text variant="heading">{title}</Text>
        {hint ? <Text tone="muted">{hint}</Text> : null}
      </View>
      {isChoice ? (
        <View style={[styles.radio, selected && styles.radioOn]}>
          {selected ? <Check size={18} color={color.textOnBrand} strokeWidth={3} /> : null}
        </View>
      ) : (
        <ChevronRight size={24} color={color.textFaint} />
      )}
    </Pressable>
  );
}

const TILE = 56;
const RADIO = 28;

const styles = StyleSheet.create({
  card: {
    minHeight: layout.minTouch,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.lg,
    padding: space.lg,
    backgroundColor: color.surface,
    borderRadius: radius.card,
    borderWidth: 1,
    borderColor: color.border,
  },
  selected: { borderColor: color.accent, borderWidth: 2, backgroundColor: color.accentSoft },
  pressed: { backgroundColor: color.border },
  tile: {
    width: TILE,
    height: TILE,
    borderRadius: radius.lg,
    backgroundColor: color.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, gap: space.xs },
  radio: {
    width: RADIO,
    height: RADIO,
    borderRadius: radius.pill,
    borderWidth: 2,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOn: { backgroundColor: color.accent, borderColor: color.accent },
});
