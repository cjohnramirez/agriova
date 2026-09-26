import { ArrowLeft } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { color, layout, space } from '@/theme/tokens';
import { IconButton } from './IconButton';
import { Text } from './Text';

type ScreenHeaderProps = {
  title: string;
  /** Spoken label for the back button, from i18n. */
  backLabel: string;
  onBack: () => void;
};

/** "← Title" bar for pushed screens, as on the prototype's Settings and Notifications. */
export function ScreenHeader({ title, backLabel, onBack }: ScreenHeaderProps) {
  return (
    <View style={styles.bar}>
      <IconButton icon={ArrowLeft} label={backLabel} onPress={onBack} />
      <Text variant="heading" accessibilityRole="header" numberOfLines={2} style={styles.title}>
        {title}
      </Text>
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
  title: { flex: 1 },
});
