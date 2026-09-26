import { ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { addDays, todayLocal } from '@/db/units';
import { useI18n } from '@/i18n';
import { daysEnding, formatDateLong } from '@/i18n/dates';
import { space } from '@/theme/tokens';
import { Field, IconButton, Text, WeekStrip } from '@/ui';

/**
 * "When" for a record: the last seven days on the week strip, today already
 * picked, with arrows to page back for something logged late. It never pages
 * into the future.
 */
export function DayPicker({
  value,
  onChange,
}: {
  value: string;
  onChange: (date: string) => void;
}) {
  const { t, language } = useI18n();
  const today = todayLocal();
  const [end, setEnd] = useState(today);
  const atToday = end >= today;

  return (
    <Field label={t('formWhen')}>
      <WeekStrip days={daysEnding(end, language)} selected={value} onSelect={onChange} />
      <View style={styles.row}>
        <IconButton
          icon={ChevronLeft}
          label={t('formEarlier')}
          onPress={() => setEnd(addDays(end, -7))}
        />
        <Text style={styles.chosen} accessibilityLiveRegion="polite">
          {formatDateLong(value, language)}
        </Text>
        {atToday ? (
          <View style={styles.spacer} />
        ) : (
          <IconButton
            icon={ChevronRight}
            label={t('formLater')}
            onPress={() => setEnd(addDays(end, 7) > today ? today : addDays(end, 7))}
          />
        )}
      </View>
    </Field>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: space.md },
  chosen: { flex: 1, textAlign: 'center' },
  // Holds the date centred when the forward arrow is hidden.
  spacer: { width: 48 },
});
