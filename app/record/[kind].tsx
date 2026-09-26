import { useLocalSearchParams, useRouter } from 'expo-router';
import { Hammer } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useI18n } from '@/i18n';
import { color, layout } from '@/theme/tokens';
import { EmptyState, ScreenHeader } from '@/ui';

const titles = { expense: 'recordExpense', harvest: 'recordHarvest', sale: 'recordSale' } as const;

/** Placeholder for the record forms, which arrive in step 6. */
export default function RecordForm() {
  const { t } = useI18n();
  const router = useRouter();
  const { kind } = useLocalSearchParams<{ kind: keyof typeof titles }>();

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: color.background }}>
      <ScreenHeader
        title={t(titles[kind] ?? 'recordExpense')}
        backLabel={t('back')}
        onBack={() => router.back()}
      />
      <SafeAreaView edges={[]} style={{ padding: layout.screenPadding }}>
        <EmptyState icon={Hammer} title={t('comingSoon')} />
      </SafeAreaView>
    </SafeAreaView>
  );
}
