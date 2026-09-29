import { useRouter } from 'expo-router';
import { BellOff, CloudRain, Sun, TriangleAlert, type LucideIcon } from 'lucide-react-native';

import { useAdvice } from '@/features/useAdvice';
import { useI18n } from '@/i18n';
import { describeAdvice } from '@/i18n/labels';
import type { Advice } from '@/rules/advice';
import { Card, EmptyState, ListRow, Screen, ScreenHeader } from '@/ui';

function iconFor(advice: Advice): LucideIcon {
  if (advice.id === 'rain') return CloudRain;
  if (advice.id === 'heat') return Sun;
  return TriangleAlert;
}

/**
 * Notifications, worked out on the phone from the farmer's records and the
 * cached forecast, so they arrive with no signal: heat, rain, and produce
 * close to spoiling. The "good day" all-clear is left to the Activity tab.
 */
export default function Notifications() {
  const { t, language } = useI18n();
  const router = useRouter();
  const alerts = useAdvice().filter((item) => item.kind !== 'approve');

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
          {alerts.map((item) => {
            const { title, body } = describeAdvice(t, language, item);
            return (
              <ListRow
                key={item.id}
                icon={iconFor(item)}
                tone={item.kind === 'warning' ? 'danger' : 'default'}
                title={title}
                subtitle={body}
              />
            );
          })}
        </Card>
      ) : (
        <EmptyState icon={BellOff} title={t('notificationsEmpty')} />
      )}
    </Screen>
  );
}
