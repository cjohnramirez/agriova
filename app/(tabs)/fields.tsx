import { useRouter } from 'expo-router';
import { Plus, Search, Sprout } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useOwnerId } from '@/auth/SessionProvider';
import { useLiveQuery } from '@/db/live';
import { cropName, listPlots, type PlotSummary } from '@/db/read';
import { formatArea, formatPesos } from '@/db/units';
import { useI18n } from '@/i18n';
import { statusLabel } from '@/i18n/labels';
import { TabScreen } from '@/shell/TabScreen';
import { color, space } from '@/theme/tokens';
import { Button, Card, Chip, EmptyState, SectionHeader, Text, TextField } from '@/ui';

/** Past this many plots, a search box earns its place above the list. */
const SEARCH_FROM = 4;

/**
 * Fields, in the prototype's "List Mode". Each plot shows its size, what is
 * on it now, and what it has earned this season. The map view waits for
 * v1.x: drawing boundaries needs a map key and works poorly offline.
 */
export default function Fields() {
  const { t } = useI18n();
  const router = useRouter();
  const ownerId = useOwnerId();
  const plots = useLiveQuery((db) => listPlots(db, ownerId), [ownerId]);
  const [query, setQuery] = useState('');

  const addPlot = () => router.push('/plot/new');

  if (plots.length === 0) {
    return (
      <TabScreen>
        <EmptyState
          icon={Sprout}
          title={t('fieldsEmptyTitle')}
          body={t('fieldsEmptyBody')}
          action={{ label: t('fieldsAdd'), onPress: addPlot }}
        />
      </TabScreen>
    );
  }

  const needle = query.trim().toLowerCase();
  const shown = needle ? plots.filter((p) => p.name.toLowerCase().includes(needle)) : plots;

  return (
    <TabScreen>
      <SectionHeader
        title={t('fieldsTitle')}
        subtitle={t('fieldsCount', { count: plots.length })}
        action={{ icon: Plus, label: t('fieldsAdd'), onPress: addPlot }}
      />
      {plots.length >= SEARCH_FROM ? (
        <TextField
          label={t('fieldsSearch')}
          value={query}
          onChangeText={setQuery}
          prefix={<Search size={22} color={color.textMuted} />}
          returnKeyType="search"
        />
      ) : null}

      {shown.map((plot) => (
        <PlotCard key={plot.id} plot={plot} onPress={() => router.push(`/plot/${plot.id}`)} />
      ))}
      {shown.length === 0 ? (
        <Text tone="muted">{t('fieldsNoMatch', { query: query.trim() })}</Text>
      ) : null}

      <Button variant="secondary" icon={Plus} label={t('fieldsAdd')} onPress={addPlot} block />
    </TabScreen>
  );
}

function PlotCard({ plot, onPress }: { plot: PlotSummary; onPress: () => void }) {
  const { t, language } = useI18n();
  const size = plot.areaSqm ? formatArea(plot.areaSqm) : t('plotSizeUnknown');
  const earnings = `${t('fieldsEarnings')} ${formatPesos(plot.netCentavos)}`;

  return (
    <Card onPress={onPress} accessibilityLabel={`${plot.name}, ${size}, ${earnings}`}>
      <View style={styles.text}>
        <Text variant="heading">{plot.name}</Text>
        <Text tone="muted">{size}</Text>
      </View>
      <View style={styles.chips}>
        {plot.cycles.length ? (
          plot.cycles.map((cycle) => (
            <Chip
              key={cycle.id}
              dot={cycle.status === 'growing' ? color.action : color.warning}
              label={`${cropName(cycle, language)} · ${statusLabel(t, cycle.status)}`}
            />
          ))
        ) : (
          <Chip tone="muted" label={t('fieldsNothingPlanted')} />
        )}
      </View>
      {plot.cycles.length ? (
        <Text variant="bodyStrong" tone={plot.netCentavos < 0 ? 'danger' : 'accent'} numeric>
          {earnings}
        </Text>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  text: { gap: space.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
});
