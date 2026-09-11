import type { ReactNode } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { LucideIcon } from 'lucide-react-native';

import { color, fontSize, fontWeight, layout, radius, space } from '@/theme/tokens';

/**
 * Shared scaffold so every tab has the same margins, header treatment and
 * scroll behaviour. `edges` omits the bottom because the tab bar covers it.
 *
 * The bottom padding clears the tab bar deliberately. On iOS the bar is
 * translucent, so without it the last row of content sits under glass and
 * becomes unreadable.
 */
export function Screen({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        contentInsetAdjustmentBehavior="automatic"
      >
        <Text style={styles.title}>{title}</Text>
        {children}
      </ScrollView>
    </SafeAreaView>
  );
}

/** Placeholder for a surface that is planned but not built yet. */
export function Placeholder({ label, icon: IconComponent }: { label: string; icon?: LucideIcon }) {
  return (
    <View style={styles.placeholder}>
      {IconComponent ? <IconComponent size={40} color={color.textFaint} strokeWidth={1.5} /> : null}
      <Text style={styles.placeholderText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.background },
  scroll: {
    padding: layout.screenPadding,
    gap: space.lg,
    paddingBottom: layout.tabBarHeight + space.xxl,
  },
  title: {
    fontSize: fontSize.heading,
    fontWeight: fontWeight.bold,
    color: color.text,
  },
  placeholder: {
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    borderRadius: radius.lg,
    padding: space.xl,
    alignItems: 'center',
    gap: space.md,
  },
  placeholderText: {
    fontSize: fontSize.body,
    color: color.textMuted,
    textAlign: 'center',
  },
});
