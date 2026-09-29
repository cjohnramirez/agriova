import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import { CloudSun, FileText, Tag } from 'lucide-react-native';
import { Linking } from 'react-native';

import { useI18n } from '@/i18n';
import { PRIVACY_POLICY_URL } from '@/links';
import { Card, ListRow, Logo, Screen, ScreenHeader, Text } from '@/ui';

/**
 * What the app is, its version, and the privacy policy. Both stores expect the
 * policy to be reachable from inside the app. Open-Meteo's licence (CC BY 4.0)
 * requires the weather credit.
 */
export default function About() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <ScreenHeader title={t('aboutTitle')} backLabel={t('back')} onBack={() => router.back()} />
      }
    >
      <Card>
        <Logo variant="wordmark" height={28} />
        <Text tone="muted">{t('aboutSummary')}</Text>
      </Card>

      <Card gap="none">
        <ListRow icon={Tag} title={t('aboutVersion')} value={Constants.expoConfig?.version} />
        <ListRow
          icon={FileText}
          title={t('aboutPrivacy')}
          onPress={() => Linking.openURL(PRIVACY_POLICY_URL)}
        />
        <ListRow icon={CloudSun} title={t('aboutWeather')} />
      </Card>
    </Screen>
  );
}
