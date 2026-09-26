import { CalendarDays } from 'lucide-react-native';

import { useI18n } from '@/i18n';
import { TabScreen } from '@/shell/TabScreen';
import { EmptyState } from '@/ui';

/** Schedule with rules-engine warnings. Built in step 5. */
export default function Activity() {
  const { t } = useI18n();
  return (
    <TabScreen>
      <EmptyState
        icon={CalendarDays}
        title={t('activityEmptyTitle')}
        body={t('activityEmptyBody')}
      />
    </TabScreen>
  );
}
