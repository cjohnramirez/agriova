import { useRouter } from 'expo-router';
import { StyleSheet, View } from 'react-native';
import { CloudUpload, Ruler, Sprout, Tractor, Wheat } from 'lucide-react-native';

import { useOwnerId } from '@/auth/SessionProvider';
import { useLiveQuery } from '@/db/live';
import { cropName, expensesByCategory, farmCounts, harvestByCrop, seasonTotals } from '@/db/read';
import { formatArea, formatPesos, formatQuantity } from '@/db/units';
import { FinanceCard } from '@/features/FinanceCard';
import { useI18n } from '@/i18n';
import { categoryLabel } from '@/i18n/labels';
import { space } from '@/theme/tokens';
import { Card, ListRow, MetricTile, Screen, ScreenHeader, Section, Text, Tiles } from '@/ui';

/**
 * The prototype's Statistics screen, fed by the ledger. Its soil, pH and plant
 * health panels are gone: they need sensors a smallholder does not own, and a
 * card showing a guessed reading is worse than no card.
 */
export default function Statistics() {
  const { t, language } = useI18n();
  const router = useRouter();
  const ownerId = useOwnerId();

  const counts = useLiveQuery((db) => farmCounts(db, ownerId), [ownerId]);
  const season = useLiveQuery((db) => seasonTotals(db, ownerId), [ownerId]);
  const spending = useLiveQuery((db) => expensesByCategory(db, ownerId), [ownerId]);
  const harvests = useLiveQuery((db) => harvestByCrop(db, ownerId), [ownerId]);

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <ScreenHeader title={t('statsTitle')} backLabel={t('back')} onBack={() => router.back()} />
      }
    >
      <View style={styles.group}>
        <Text tone="muted">{t('statsSubtitle')}</Text>
        <Tiles>
          <MetricTile icon={Tractor} label={t('metricPlots')} value={String(counts.plots)} />
          <MetricTile
            icon={Ruler}
            label={t('metricArea')}
            value={counts.areaSqm ? formatArea(counts.areaSqm) : t('metricAreaUnknown')}
          />
        </Tiles>
        <Tiles>
          <MetricTile icon={Sprout} label={t('metricGrowing')} value={String(season.cycles)} />
          <MetricTile
            icon={CloudUpload}
            label={t('metricPending')}
            value={String(counts.pendingSync)}
            caption={counts.pendingSync ? t('metricPendingCaption') : t('metricAllSent')}
          />
        </Tiles>
      </View>

      <FinanceCard />

      <Section title={t('statsSpending')}>
        <Card gap="none">
          {spending.length ? (
            spending.map((row) => (
              <ListRow
                key={row.category}
                title={categoryLabel(t, row.category)}
                value={formatPesos(row.amountCentavos)}
              />
            ))
          ) : (
            <Text tone="muted">{t('statsNothing')}</Text>
          )}
        </Card>
      </Section>

      <Section title={t('statsHarvest')}>
        <Card gap="none">
          {harvests.length ? (
            harvests.map((row) => (
              <ListRow
                key={`${row.cropId}-${row.unit}`}
                icon={Wheat}
                title={cropName(row, language)}
                value={formatQuantity(row.quantityMilli, row.unit, language)}
              />
            ))
          ) : (
            <Text tone="muted">{t('statsNothing')}</Text>
          )}
        </Card>
      </Section>
    </Screen>
  );
}

const styles = StyleSheet.create({
  group: { gap: space.md },
});
