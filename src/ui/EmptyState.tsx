import type { LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { color, radius, space } from '@/theme/tokens';
import { Button } from './Button';
import { Card } from './Card';
import { Text } from './Text';

type EmptyStateProps = {
  icon: LucideIcon;
  title: string;
  body?: string;
  /** Every empty state should invite the first record. */
  action?: { label: string; onPress: () => void };
};

export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <Card padding="hero" style={styles.card}>
      <View style={styles.iconWrap}>
        <Icon size={32} color={color.accent} />
      </View>
      <Text variant="heading" style={styles.center}>
        {title}
      </Text>
      {body ? (
        <Text tone="muted" style={styles.center}>
          {body}
        </Text>
      ) : null}
      {action ? (
        // Buttons hug their label from the left; this wrapper puts it in the middle.
        <View style={styles.action}>
          <Button label={action.label} onPress={action.onPress} />
        </View>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { alignItems: 'center' },
  iconWrap: {
    width: 64,
    height: 64,
    borderRadius: radius.pill,
    backgroundColor: color.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: space.xs,
  },
  center: { textAlign: 'center' },
  action: { alignSelf: 'center' },
});
