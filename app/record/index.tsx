import { useRouter } from 'expo-router';
import { HandCoins, Receipt, Wheat } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useI18n } from '@/i18n';
import { layout, space } from '@/theme/tokens';
import { ChoiceCard, Text } from '@/ui';

/**
 * The "+ Itala" sheet. Three large choices, because recording is the ledger
 * and every other number in the app is built from these three kinds of entry.
 */
export default function RecordSheet() {
  const { t } = useI18n();
  const router = useRouter();
  const insets = useSafeAreaInsets();

  const open = (kind: 'expense' | 'harvest' | 'sale') =>
    router.replace({ pathname: '/record/[kind]', params: { kind } });

  return (
    <View style={[styles.sheet, { paddingBottom: insets.bottom + space.lg }]}>
      <Text variant="heading" accessibilityRole="header">
        {t('recordTitle')}
      </Text>
      <ChoiceCard
        icon={Receipt}
        title={t('recordExpense')}
        hint={t('recordExpenseHint')}
        onPress={() => open('expense')}
      />
      <ChoiceCard
        icon={Wheat}
        title={t('recordHarvest')}
        hint={t('recordHarvestHint')}
        onPress={() => open('harvest')}
      />
      <ChoiceCard
        icon={HandCoins}
        title={t('recordSale')}
        hint={t('recordSaleHint')}
        onPress={() => open('sale')}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { gap: space.md, paddingHorizontal: layout.screenPadding, paddingTop: space.xl },
});
