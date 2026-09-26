import { useRouter } from 'expo-router';
import { BellOff, Clock } from 'lucide-react-native';

import { cropName } from '@/db/read';
import { sellSoonBody, useProduceOnHand } from '@/features/useProduceOnHand';
import { useI18n } from '@/i18n';
import { Card, EmptyState, ListRow, Screen, ScreenHeader } from '@/ui';

/**
 * Notifications, worked out on the phone from the farmer's own records, so
 * they arrive with no signal. Today that is produce close to spoiling; heat
 * warnings and marketplace updates join in steps 7 and 8.
 */
export default function Notifications() {
  const { t, language } = useI18n();
  const router = useRouter();
  const alerts = useProduceOnHand().filter((item) => item.level !== 'fresh');

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <ScreenHeader
          title={t('notificationsTitle')}
          backLabel={t('back')}
          onBack={() => router.back()}
        />
      }
    >
      {alerts.length ? (
        <Card gap="none">
          {alerts.map((item) => (
            <ListRow
              key={item.id}
              icon={Clock}
              tone={item.level === 'urgent' ? 'danger' : 'default'}
              title={t('notificationsSellTitle', { crop: cropName(item, language) })}
              subtitle={sellSoonBody(t, language, item)}
            />
          ))}
        </Card>
      ) : (
        <EmptyState icon={BellOff} title={t('notificationsEmpty')} />
      )}
    </Screen>
  );
}
