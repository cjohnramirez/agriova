import { CircleCheck, Sparkles, TriangleAlert, type LucideIcon } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { color, space } from '@/theme/tokens';
import { Button } from './Button';
import { GradientCard } from './Card';
import { Text } from './Text';

const kinds: Record<
  'warning' | 'approve' | 'suggest',
  { icon: LucideIcon; gradient: 'brand' | 'danger'; actionTint: string }
> = {
  warning: { icon: TriangleAlert, gradient: 'danger', actionTint: color.danger },
  approve: { icon: CircleCheck, gradient: 'brand', actionTint: color.accent },
  suggest: { icon: Sparkles, gradient: 'brand', actionTint: color.accent },
};

type AlertCardProps = {
  kind: keyof typeof kinds;
  /** Short, e.g. "Heat warning". The icon and title carry the meaning, not the color. */
  title: string;
  body: string;
  action?: { label: string; onPress: () => void };
};

/**
 * The "AI Warning" / "AI Approves" / "AI Suggests" card from the Schedule
 * screen. The content comes from the on-device rules engine, so it works with
 * no signal; only the chat needs a connection.
 */
export function AlertCard({ kind, title, body, action }: AlertCardProps) {
  const k = kinds[kind];
  const Icon = k.icon;

  return (
    <GradientCard gradient={k.gradient}>
      <View style={styles.head} accessible accessibilityRole="summary">
        <Icon size={22} color={color.textOnBrand} strokeWidth={2} />
        <Text variant="bodyStrong" tone="onBrand" style={styles.title}>
          {title}
        </Text>
      </View>
      <Text tone="onBrand">{body}</Text>
      {action ? (
        <View style={styles.action}>
          <Button
            variant="onCard"
            tint={k.actionTint}
            label={action.label}
            onPress={action.onPress}
            block
          />
        </View>
      ) : null}
    </GradientCard>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  title: { flex: 1 },
  action: { paddingTop: space.xs },
});
