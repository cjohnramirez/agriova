import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';

import { space } from '@/theme/tokens';
import { Text } from './Text';

type FieldProps = {
  label: string;
  /** Shown under the choices in red text; the words carry it, not the color. */
  error?: string | null;
  children: ReactNode;
};

/**
 * A labelled question in a form whose answer is not a text box: pills, cards,
 * a day strip. Matches `TextField`'s label so a form reads as one column of
 * questions.
 */
export function Field({ label, error, children }: FieldProps) {
  return (
    <View style={styles.field}>
      <Text variant="bodyStrong">{label}</Text>
      {children}
      {error ? (
        <Text tone="danger" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  field: { gap: space.sm },
});
