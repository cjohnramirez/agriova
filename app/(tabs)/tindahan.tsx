import { Tag } from 'lucide-react-native';

import { Screen, Placeholder } from '@/components/Screen';
import { useI18n } from '@/i18n';

export default function Tindahan() {
  const { t } = useI18n();
  return (
    <Screen title={t('marketTitle')}>
      <Placeholder label={t('marketEmpty')} icon={Tag} />
    </Screen>
  );
}
