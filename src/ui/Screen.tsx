import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView, type Edge } from 'react-native-safe-area-context';

import { color, layout, space } from '@/theme/tokens';

type ScreenProps = {
  children: ReactNode;
  /** Rendered above the scroll area and never scrolls away, e.g. a TopBar. */
  header?: ReactNode;
  /** Off for screens that manage their own list, such as a FlashList. */
  scroll?: boolean;
  edges?: Edge[];
};

/**
 * Standard screen frame: safe area, 16dp gutter, sections spaced 24 apart, and
 * content capped at a readable width on tablets. The bottom padding clears a
 * translucent tab bar.
 */
export function Screen({ children, header, scroll = true, edges = ['top'] }: ScreenProps) {
  const body = <View style={styles.content}>{children}</View>;

  return (
    <SafeAreaView style={styles.safe} edges={edges}>
      {header}
      {scroll ? (
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          {body}
        </ScrollView>
      ) : (
        body
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.background },
  scroll: { flexGrow: 1, paddingBottom: layout.tabBarClearance },
  content: {
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
    paddingHorizontal: layout.screenPadding,
    paddingTop: space.lg,
    gap: space.xl,
  },
});
