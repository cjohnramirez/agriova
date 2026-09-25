import { LinearGradient } from 'expo-linear-gradient';
import { Pressable, StyleSheet, View } from 'react-native';

import { color, gradient, layout, radius, space } from '@/theme/tokens';
import { Text } from './Text';

export type WeekDay = {
  /** 'YYYY-MM-DD', matching the database's calendar dates. */
  date: string;
  /** Short weekday in the current language, e.g. "Mi" or "W". */
  weekday: string;
  /** Spoken label, e.g. "Wednesday, May 15". */
  spoken: string;
};

type WeekStripProps = {
  days: readonly WeekDay[];
  selected: string;
  onSelect: (date: string) => void;
};

/**
 * The seven-day strip from the Schedule screen. The selected day becomes the
 * green gradient capsule. Each day is a full 56dp-tall target even though
 * seven must fit across a 320dp screen.
 */
export function WeekStrip({ days, selected, onSelect }: WeekStripProps) {
  return (
    <View style={styles.row} accessibilityRole="tablist">
      {days.map((day) => {
        const isOn = day.date === selected;
        const dayNumber = String(Number(day.date.slice(8)));
        const body = (
          <>
            <Text variant="label" tone={isOn ? 'onBrand' : 'muted'} maxFontSizeMultiplier={1.2}>
              {day.weekday}
            </Text>
            <View style={[styles.num, isOn && styles.numOn]}>
              <Text variant="bodyStrong" numeric maxFontSizeMultiplier={1.15}>
                {dayNumber}
              </Text>
            </View>
          </>
        );
        return (
          <Pressable
            key={day.date}
            onPress={() => onSelect(day.date)}
            accessibilityRole="tab"
            accessibilityLabel={day.spoken}
            accessibilityState={{ selected: isOn }}
            style={styles.cell}
          >
            {isOn ? (
              <LinearGradient
                colors={gradient.brand}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={[styles.capsule]}
              >
                {body}
              </LinearGradient>
            ) : (
              <View style={styles.capsule}>{body}</View>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const NUM = 36;

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', gap: space.xs },
  cell: { flex: 1, minHeight: layout.minTouch },
  capsule: {
    alignItems: 'center',
    gap: space.xs,
    paddingVertical: space.sm,
    paddingHorizontal: space.xs,
    borderRadius: radius.pill,
  },
  // Seven days share a 320dp screen, about 38dp each. The circle fills its cell
  // up to 36 so neighbours never touch, and the digits cap their scaling.
  num: {
    width: '100%',
    maxWidth: NUM,
    aspectRatio: 1,
    borderRadius: radius.pill,
    backgroundColor: color.surface,
    borderWidth: 1,
    borderColor: color.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  numOn: { borderColor: color.surface },
});
