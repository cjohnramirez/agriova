import { ChevronLeft, ChevronRight, NotebookPen } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { useOwnerId } from '@/auth/SessionProvider';
import { useLiveQuery } from '@/db/live';
import { ledger, type LedgerKind } from '@/db/read';
import { addDays, todayLocal } from '@/db/units';
import { LedgerList } from '@/features/LedgerList';
import { useI18n } from '@/i18n';
import { formatDateLong, formatMonthYear, weekOf } from '@/i18n/dates';
import { TabScreen } from '@/shell/TabScreen';
import { space } from '@/theme/tokens';
import { Button, EmptyState, FilterPills, IconButton, Text, WeekStrip } from '@/ui';

type Filter = 'all' | LedgerKind;

/**
 * Activity: the prototype's Schedule screen, holding the farm's records day by
 * day. The week strip picks the day; the pills narrow it to one kind. Planned
 * tasks and the rules engine's warnings join this timeline in step 8.
 */
export default function Activity() {
  const { t, language } = useI18n();
  const router = useRouter();
  const ownerId = useOwnerId();
  const today = todayLocal();
  const [day, setDay] = useState(today);
  const [filter, setFilter] = useState<Filter>('all');

  const entries = useLiveQuery(
    (db) =>
      ledger(db, ownerId, { from: day, to: day, kind: filter === 'all' ? undefined : filter }),
    [ownerId, day, filter],
  );

  return (
    <TabScreen>
      <View style={styles.month}>
        <IconButton
          icon={ChevronLeft}
          label={t('activityPrevWeek')}
          onPress={() => setDay(addDays(day, -7))}
        />
        <Text variant="heading" style={styles.monthLabel} accessibilityRole="header">
          {formatMonthYear(day, language)}
        </Text>
        <IconButton
          icon={ChevronRight}
          label={t('activityNextWeek')}
          onPress={() => setDay(addDays(day, 7))}
        />
      </View>
      <View style={styles.week}>
        <WeekStrip days={weekOf(day, language)} selected={day} onSelect={setDay} />
        {day !== today ? (
          <View style={styles.center}>
            <Button variant="secondary" label={t('activityToday')} onPress={() => setDay(today)} />
          </View>
        ) : null}
      </View>

      <FilterPills
        label={t('activityFilter')}
        selected={filter}
        onSelect={setFilter}
        options={[
          { key: 'all', label: t('activityAll') },
          { key: 'expense', label: t('recordExpense') },
          { key: 'harvest', label: t('recordHarvest') },
          { key: 'sale', label: t('recordSale') },
        ]}
      />

      {entries.length ? (
        <View style={styles.day}>
          <Text variant="bodyStrong">{formatDateLong(day, language)}</Text>
          <LedgerList entries={entries} />
        </View>
      ) : (
        <EmptyState
          icon={NotebookPen}
          title={t('activityDayEmpty', { date: formatDateLong(day, language) })}
          body={t('activityDayEmptyBody')}
          action={{ label: t('recordButton'), onPress: () => router.push('/record') }}
        />
      )}
    </TabScreen>
  );
}

const styles = StyleSheet.create({
  month: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  monthLabel: { flex: 1, textAlign: 'center' },
  week: { gap: space.md },
  center: { alignItems: 'center' },
  day: { gap: space.md },
});
