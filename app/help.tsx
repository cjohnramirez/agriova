import { useRouter } from 'expo-router';
import { Mail } from 'lucide-react-native';
import { Linking } from 'react-native';

import { useI18n } from '@/i18n';
import type { StringKey } from '@/i18n/strings';
import { SUPPORT_EMAIL } from '@/links';
import { Card, ListRow, Screen, ScreenHeader, Text } from '@/ui';

/** The questions a new farmer asks first, answered in a line or two. */
const QUESTIONS: [StringKey, StringKey][] = [
  ['helpRecordQ', 'helpRecordA'],
  ['helpOfflineQ', 'helpOfflineA'],
  ['helpPhoneQ', 'helpPhoneA'],
  ['helpAssistantQ', 'helpAssistantA'],
];

export default function Help() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <ScreenHeader title={t('helpTitle')} backLabel={t('back')} onBack={() => router.back()} />
      }
    >
      {QUESTIONS.map(([q, a]) => (
        <Card key={q}>
          <Text variant="heading">{t(q)}</Text>
          <Text tone="muted">{t(a)}</Text>
        </Card>
      ))}

      {SUPPORT_EMAIL ? (
        <Card gap="none">
          <ListRow
            icon={Mail}
            title={t('helpContact')}
            subtitle={SUPPORT_EMAIL}
            onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)}
          />
        </Card>
      ) : null}
    </Screen>
  );
}
