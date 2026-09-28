import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { LANGUAGE_NAMES, LANGUAGES, useI18n } from '@/i18n';
import { color, layout, space } from '@/theme/tokens';
import { Button, ChoiceCard, Logo, Text } from '@/ui';

/**
 * First screen after install. Language comes first, before any text a farmer
 * has to read, so everything after it is in the language they chose.
 */
export default function Welcome() {
  const { t, language, setLanguage } = useI18n();
  const router = useRouter();

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'bottom']}>
      <View style={styles.body}>
        <Logo variant="wordmark" height={44} />
        <View style={styles.intro}>
          <Text variant="title" accessibilityRole="header">
            {t('welcomeTitle')}
          </Text>
          <Text tone="muted">{t('welcomeBody')}</Text>
        </View>

        <View style={styles.choices} accessibilityRole="radiogroup">
          <Text variant="bodyStrong">{t('welcomeLanguage')}</Text>
          {LANGUAGES.map((lang) => (
            <ChoiceCard
              key={lang}
              title={LANGUAGE_NAMES[lang]}
              selected={language === lang}
              onPress={() => setLanguage(lang)}
            />
          ))}
        </View>
      </View>

      <View style={styles.footer}>
        <Button label={t('continue')} onPress={() => router.push('/email')} block />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: color.background },
  body: {
    flex: 1,
    justifyContent: 'center',
    gap: space.xxl,
    paddingHorizontal: layout.screenPadding,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
  intro: { gap: space.sm },
  choices: { gap: space.md },
  footer: {
    paddingHorizontal: layout.screenPadding,
    paddingBottom: space.lg,
    width: '100%',
    maxWidth: layout.maxContentWidth,
    alignSelf: 'center',
  },
});
