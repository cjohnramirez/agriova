import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { color, radius, space } from '@/theme/tokens';
import { Text } from './Text';

const tones = {
  /** "On Progress", "Harvest Season": white pill with accent text. */
  default: { bg: color.surface, fg: color.accent, border: color.border },
  /** The same pill sitting on a green or red card. */
  onCard: { bg: color.onBrandSoft, fg: color.textOnBrand, border: null },
  muted: { bg: color.background, fg: color.textMuted, border: null },
} as const;

type ChipProps = {
  label: string;
  tone?: keyof typeof tones;
  /** A status dot before the label, as in "● 2 Ongoing". */
  dot?: string;
  /** A leading icon, as in the hero's location pill. */
  icon?: LucideIcon;
};

/** A read-only status pill. For a selectable pill use `FilterPill`. */
export function Chip({ label, tone = 'default', dot, icon: Icon }: ChipProps) {
  const t = tones[tone];
  return (
    <View
      style={[
        styles.chip,
        { backgroundColor: t.bg },
        t.border && { borderWidth: 1, borderColor: t.border },
      ]}
    >
      {dot ? <View style={[styles.dot, { backgroundColor: dot }]} /> : null}
      {Icon ? <Icon size={16} color={t.fg} strokeWidth={2} /> : null}
      <Text variant="label" style={{ color: t.fg }}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: space.xs,
    paddingVertical: space.xs,
    paddingHorizontal: space.md,
    borderRadius: radius.pill,
  },
  dot: { width: 8, height: 8, borderRadius: radius.pill },
});
