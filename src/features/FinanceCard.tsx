import { Wallet } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { useOwnerId } from '@/auth/SessionProvider';
import { useLiveQuery } from '@/db/live';
import { monthlyTotals, runningTotal } from '@/db/read';
import { formatPesos, todayLocal } from '@/db/units';
import { useI18n } from '@/i18n';
import { formatMonthShort } from '@/i18n/dates';
import { color, space } from '@/theme/tokens';
import { Card, StepChart, Text } from '@/ui';

const MONTHS = 6;

/**
 * The prototype's "Finances Tracker", fed by the farmer's own ledger: a running
 * balance over six months, the net for the period, and what came in and went
 * out. A month that lost money shows as a red step down.
 *
 * Home passes `totals={false}`: its hero already shows the money, and the same
 * figures twice in a row read as two different numbers.
 */
export function FinanceCard({ totals = true }: { totals?: boolean }) {
  const { t, language } = useI18n();
  const ownerId = useOwnerId();
  const today = todayLocal();
  const months = useLiveQuery((db) => monthlyTotals(db, ownerId, today, MONTHS), [ownerId, today]);

  const sold = months.reduce((sum, m) => sum + m.revenueCentavos, 0);
  const spent = months.reduce((sum, m) => sum + m.expenseCentavos, 0);
  // A leading zero anchors the chart, so the first month's gain or loss shows as a step.
  const balance = [0, ...runningTotal(months.map((m) => m.netCentavos))];

  return (
    <Card>
      <View style={styles.head}>
        <Text variant="bodyStrong" style={styles.flex}>
          {t('financeTitle')}
        </Text>
        <Wallet size={22} color={color.accent} strokeWidth={1.75} />
      </View>
      <StepChart
        values={balance}
        accessibilityLabel={t('financeChart', {
          start: formatMonthShort(months[0].month, language),
          end: formatMonthShort(months[months.length - 1].month, language),
        })}
      />
      {totals ? (
        <>
          <View>
            <Text tone="muted">{t('financeCaption')}</Text>
            <Text variant="figure" tone={sold - spent < 0 ? 'danger' : 'accent'} numeric>
              {formatPesos(sold - spent)}
            </Text>
          </View>
          <View style={styles.split}>
            <Text tone="muted" numeric>
              {t('homeSold')} {formatPesos(sold)}
            </Text>
            <Text tone="muted" numeric>
              {t('homeSpent')} {formatPesos(spent)}
            </Text>
          </View>
        </>
      ) : null}
    </Card>
  );
}

const styles = StyleSheet.create({
  head: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  flex: { flex: 1 },
  split: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.lg, rowGap: space.xs },
});
