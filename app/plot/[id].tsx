import { useLocalSearchParams, useRouter } from 'expo-router';
import { Alert } from 'react-native';
import { Ruler } from 'lucide-react-native';

import { useOwnerId } from '@/auth/SessionProvider';
import { useLiveQuery, useWriter } from '@/db/live';
import { cropName, getPlot, listCycles, type CycleSummary } from '@/db/read';
import { closeCycle } from '@/db/write';
import { formatArea } from '@/db/units';
import { CycleRow } from '@/features/CycleRow';
import { useI18n } from '@/i18n';
import { Card, ListRow, Screen, ScreenHeader, Section, Text } from '@/ui';

/** One plot: its size, what is planted now, and past seasons with their results. */
export default function PlotDetail() {
  const { t, language } = useI18n();
  const router = useRouter();
  const ownerId = useOwnerId();
  const writer = useWriter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const plot = useLiveQuery((db) => getPlot(db, ownerId, id), [ownerId, id]);
  const cycles = useLiveQuery(
    (db) => listCycles(db, ownerId, { plotId: id, includeClosed: true }),
    [ownerId, id],
  );
  const current = cycles.filter((c) => c.status !== 'closed');
  const past = cycles.filter((c) => c.status === 'closed');

  const confirmClose = (cycle: CycleSummary) =>
    Alert.alert('', t('cycleCloseConfirm', { crop: cropName(cycle, language) }), [
      { text: t('cancel'), style: 'cancel' },
      {
        text: t('cycleClose'),
        onPress: () => closeCycle(writer.db, ownerId, cycle.id, writer.clock),
      },
    ]);

  return (
    <Screen
      edges={['top', 'bottom']}
      header={
        <ScreenHeader title={plot?.name ?? ''} backLabel={t('back')} onBack={() => router.back()} />
      }
    >
      {!plot ? (
        <Text tone="muted">{t('plotMissing')}</Text>
      ) : (
        <>
          <Card gap="none">
            <ListRow
              icon={Ruler}
              title={t('plotSize')}
              value={plot.areaSqm ? formatArea(plot.areaSqm) : t('plotSizeUnknown')}
            />
          </Card>

          <Section title={t('plotNow')}>
            <Card>
              {current.length ? (
                current.map((cycle) => (
                  <CycleRow key={cycle.id} cycle={cycle} onClose={() => confirmClose(cycle)} />
                ))
              ) : (
                <Text tone="muted">{t('plotNothingYet')}</Text>
              )}
            </Card>
          </Section>

          {past.length ? (
            <Section title={t('plotPast')}>
              <Card>
                {past.map((cycle) => (
                  <CycleRow key={cycle.id} cycle={cycle} />
                ))}
              </Card>
            </Section>
          ) : null}
        </>
      )}
    </Screen>
  );
}
