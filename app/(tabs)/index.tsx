import { useRouter } from 'expo-router';
import { ArrowUpRight, Clock, Ruler, Sprout } from 'lucide-react-native';

import { useOwnerId } from '@/auth/SessionProvider';
import { useLiveQuery } from '@/db/live';
import { cropName, farmCounts, ledger, listCycles, seasonTotals } from '@/db/read';
import { formatArea } from '@/db/units';
import { FinanceCard } from '@/features/FinanceCard';
import { HomeHero } from '@/features/HomeHero';
import { LedgerList } from '@/features/LedgerList';
import { sellSoonBody, useProduceOnHand } from '@/features/useProduceOnHand';
import { useI18n } from '@/i18n';
import { TabScreen } from '@/shell/TabScreen';
import { AlertCard, Button, Card, ListRow, MetricTile, Section, Tiles } from '@/ui';

const RECENT = 3;

/**
 * Home. The photo hero leads with the season's net earnings because it is the need farmers
 * named most: "I will finally know if I am earning." Below it, produce that
 * must be sold before it spoils, the farm at a glance, and the latest records.
 */
export default function Home() {
  const { t, language } = useI18n();
  const router = useRouter();
  const ownerId = useOwnerId();

  const season = useLiveQuery((db) => seasonTotals(db, ownerId), [ownerId]);
  const cycles = useLiveQuery((db) => listCycles(db, ownerId), [ownerId]);
  const counts = useLiveQuery((db) => farmCounts(db, ownerId), [ownerId]);
  const recent = useLiveQuery((db) => ledger(db, ownerId, { limit: RECENT }), [ownerId]);
  const produce = useProduceOnHand();
  const urgent = produce.find((item) => item.level === 'urgent');
  const hasRecords = recent.length > 0;

  return (
    <TabScreen>
      <HomeHero season={season} cycles={cycles} />

      {produce.length > 0 ? (
        <Section title={t('homeProduceTitle')} subtitle={t('homeProduceSubtitle')}>
          {urgent ? (
            <AlertCard
              kind="warning"
              title={t('sellSoonTitle')}
              body={sellSoonBody(t, language, urgent)}
            />
          ) : null}
          <Card gap="none">
            {produce.map((item) => (
              <ListRow
                key={item.id}
                icon={Clock}
                title={item.label}
                subtitle={item.plotName}
                value={item.countdown}
              />
            ))}
          </Card>
        </Section>
      ) : null}

      <Section
        title={t('homeGlanceTitle')}
        subtitle={t('homeGlanceSubtitle')}
        action={{
          icon: ArrowUpRight,
          label: t('homeStatistics'),
          onPress: () => router.push('/statistics'),
        }}
      >
        <FinanceCard />
        <Tiles>
          <MetricTile
            icon={Ruler}
            label={t('metricPlots')}
            value={String(counts.plots)}
            caption={counts.areaSqm ? formatArea(counts.areaSqm) : undefined}
          />
          <MetricTile
            icon={Sprout}
            label={t('metricGrowing')}
            value={String(season.cycles)}
            caption={cycles.map((cycle) => cropName(cycle, language)).join(', ') || undefined}
          />
        </Tiles>
      </Section>

      {hasRecords ? (
        <Section title={t('homeRecentTitle')}>
          <LedgerList entries={recent} showDate />
          <Button
            variant="secondary"
            label={t('homeRecentAll')}
            onPress={() => router.navigate('/activity')}
            block
          />
        </Section>
      ) : null}
    </TabScreen>
  );
}
