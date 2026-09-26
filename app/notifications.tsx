import { useRouter } from 'expo-router';
import { BellOff } from 'lucide-react-native';

import { useI18n } from '@/i18n';
import { EmptyState, Screen, ScreenHeader } from '@/ui';

/** Heat warnings, spoilage alerts and marketplace updates land here in later steps. */
export default function Notifications() {
  const { t } = useI18n();
  const router = useRouter();

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
      <EmptyState icon={BellOff} title={t('notificationsEmpty')} />
    </Screen>
  );
}
