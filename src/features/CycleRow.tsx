import { Flag } from 'lucide-react-native';
import { StyleSheet, View } from 'react-native';

import { cropName, type CycleSummary } from '@/db/read';
import { formatPesos } from '@/db/units';
import { useI18n } from '@/i18n';
import { formatDate } from '@/i18n/dates';
import { statusLabel } from '@/i18n/labels';
import { color, space } from '@/theme/tokens';
import { Button, Chip, Text } from '@/ui';

/** One planting: crop, status, planting date, and what it has earned so far. */
export function CycleRow({
  cycle,
  onClose,
}: {
  cycle: CycleSummary;
  /** Offered on open plantings: ends the season after a confirm. */
  onClose?: () => void;
}) {
  const { t, language } = useI18n();
  const growing = cycle.status === 'growing';

  return (
    <View style={styles.row}>
      <View style={styles.head}>
        <Text variant="bodyStrong" style={styles.flex}>
          {cropName(cycle, language)}
        </Text>
        <Chip
          label={statusLabel(t, cycle.status)}
          dot={growing ? color.action : color.textFaint}
          tone={cycle.status === 'closed' ? 'muted' : 'default'}
        />
      </View>
      <Text tone="muted">{t('plotPlanted', { date: formatDate(cycle.plantedOn, language) })}</Text>
      <Text tone={cycle.netCentavos < 0 ? 'danger' : 'accent'} numeric>
        {t('fieldsEarnings')} {formatPesos(cycle.netCentavos)}
      </Text>
      {onClose ? (
        <Button variant="secondary" icon={Flag} label={t('cycleClose')} onPress={onClose} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { gap: space.sm, paddingVertical: space.sm, alignItems: 'flex-start' },
  head: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'stretch',
    flexWrap: 'wrap',
    gap: space.sm,
  },
  flex: { flexGrow: 1 },
});
