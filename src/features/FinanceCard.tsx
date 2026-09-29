import { HandCoins } from 'lucide-react-native';
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
 * The prototype's "Finances Tracker", fed by the farmer's own ledger. Laid out
 * as in the frame: a small title with its icon, the stepped chart, then the
 * period's net in light figures on the left and the two lines that make it up
 * on the right, each a grey label beside a black amount.
 */
export function FinanceCard() {
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
      <View style={styles.title}>
        <Text variant="label" style={styles.flex}>
          {t('financeTitle')}
        </Text>
        <HandCoins size={16} color={color.text} />
      </View>
      <StepChart
        values={balance}
        accessibilityLabel={t('financeChart', {
          start: formatMonthShort(months[0].month, language),
          end: formatMonthShort(months[months.length - 1].month, language),
        })}
      />
      <View style={styles.totals}>
        <View style={styles.flex}>
          <Text variant="label">{t('financeCaption')}</Text>
          <Text variant="figure" numeric>
            {formatPesos(sold - spent)}
          </Text>
        </View>
        <View style={styles.lines}>
          <Line label={t('homeSpent')} value={formatPesos(spent)} />
          <Line label={t('homeSold')} value={formatPesos(sold)} />
        </View>
      </View>
    </Card>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.line}>
      <Text variant="label" style={styles.faint}>
        {label}
      </Text>
      <Text variant="label" numeric>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  title: { flexDirection: 'row', alignItems: 'center', gap: space.sm },
  flex: { flex: 1 },
  totals: { flexDirection: 'row', alignItems: 'flex-end', gap: space.md },
  lines: { gap: space.xs, paddingBottom: space.xs },
  line: { flexDirection: 'row', justifyContent: 'space-between', gap: space.md },
  // The prototype's grey for these two labels. The amounts beside them carry
  // the meaning, so the label may be lighter than the AA reading colours.
  faint: { color: color.textFaint },
});
