import { UserRound } from 'lucide-react-native';

import { Screen, Placeholder } from '@/components/Screen';
import { useI18n } from '@/i18n';

export default function Ako() {
  const { t } = useI18n();
  return (
    <Screen title={t('meTitle')}>
      <Placeholder label={t('comingSoon')} icon={UserRound} />
    </Screen>
  );
}
