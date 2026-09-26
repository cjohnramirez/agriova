import { MessagesSquare } from 'lucide-react-native';

import { useI18n } from '@/i18n';
import { TabScreen } from '@/shell/TabScreen';
import { EmptyState } from '@/ui';

/** Farm assistant chat. Built in step 8. */
export default function Assistant() {
  const { t } = useI18n();
  return (
    <TabScreen showRecord={false}>
      <EmptyState icon={MessagesSquare} title={t('assistantTitle')} body={t('assistantBody')} />
    </TabScreen>
  );
}
