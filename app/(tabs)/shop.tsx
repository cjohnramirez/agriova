import { ShoppingBag } from 'lucide-react-native';

import { useI18n } from '@/i18n';
import { TabScreen } from '@/shell/TabScreen';
import { EmptyState } from '@/ui';

/** Marketplace browse. Built in step 5. */
export default function Shop() {
  const { t } = useI18n();
  return (
    <TabScreen showRecord={false}>
      <EmptyState icon={ShoppingBag} title={t('shopEmptyTitle')} body={t('shopEmptyBody')} />
    </TabScreen>
  );
}
