import { Sprout } from 'lucide-react-native';

import { useI18n } from '@/i18n';
import { TabScreen } from '@/shell/TabScreen';
import { EmptyState } from '@/ui';

/** Plots and crop cycles. Built in step 5; list first, map later. */
export default function Fields() {
  const { t } = useI18n();
  return (
    <TabScreen>
      <EmptyState icon={Sprout} title={t('fieldsEmptyTitle')} body={t('fieldsEmptyBody')} />
    </TabScreen>
  );
}
