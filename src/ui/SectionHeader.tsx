import type { LucideIcon } from 'lucide-react-native';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { space } from '@/theme/tokens';
import { IconButton } from './IconButton';
import { Text } from './Text';

type SectionHeaderProps = {
  title: string;
  subtitle?: string;
  /** The prototype's circular "↗" beside "Overall Live Metrics". */
  action?: { icon: LucideIcon; label: string; onPress: () => void };
};

/** A section title inside a screen, with an optional round action button. */
export function SectionHeader({ title, subtitle, action }: SectionHeaderProps) {
  return (
    <View style={styles.row}>
      <View style={styles.text}>
        <Text variant="heading" accessibilityRole="header">
          {title}
        </Text>
        {subtitle ? <Text tone="muted">{subtitle}</Text> : null}
      </View>
      {action ? (
        <IconButton icon={action.icon} label={action.label} onPress={action.onPress} />
      ) : null}
    </View>
  );
}

/**
 * A heading with its content, 12 apart. Screens space sections 24 apart, so a
 * heading sits visibly closer to what it names than to the section above.
 */
export function Section({ children, ...header }: SectionHeaderProps & { children: ReactNode }) {
  return (
    <View style={styles.section}>
      <SectionHeader {...header} />
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  section: { gap: space.md },
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  text: { flex: 1, gap: space.xs },
});
