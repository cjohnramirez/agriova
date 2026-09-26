import { useRouter } from 'expo-router';
import type { ReactNode } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '@/i18n';
import { color, layout, space } from '@/theme/tokens';
import { ScreenHeader, Text } from '@/ui';

type FormScreenProps = {
  title: string;
  subtitle?: string;
  children: ReactNode;
  /** The main action, pinned to the bottom so it is always one thumb away. */
  footer: ReactNode;
  /** Hide the back button on a screen that has nowhere to go back to. */
  canGoBack?: boolean;
};

/**
 * Frame for the one-question-per-screen flows (sign in, onboarding, and later
 * the record forms). One question per screen is deliberate: for a farmer who
 * reads slowly, a short screen with one decision beats a long form.
 */
export function FormScreen({
  title,
  subtitle,
  children,
  footer,
  canGoBack = true,
}: FormScreenProps) {
  const router = useRouter();
  const { t } = useI18n();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      {canGoBack && router.canGoBack() ? (
        <ScreenHeader title="" backLabel={t('back')} onBack={() => router.back()} />
      ) : null}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.intro}>
            <Text variant="title" accessibilityRole="header">
              {title}
            </Text>
            {subtitle ? <Text tone="muted">{subtitle}</Text> : null}
          </View>
          {children}
        </ScrollView>
        <View style={styles.footer}>{footer}</View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.background },
  flex: { flex: 1 },
  scroll: {
    flexGrow: 1,
    gap: space.xl,
    paddingHorizontal: layout.screenPadding,
    paddingTop: space.lg,
    paddingBottom: space.xl,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  intro: { gap: space.sm },
  footer: {
    gap: space.sm,
    paddingHorizontal: layout.screenPadding,
    paddingTop: space.sm,
    paddingBottom: space.lg,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
});
