import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CalendarDays, Clock, MapPin, Plus } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useSession } from '@/auth/SessionProvider';
import { cropName, type CycleSummary, type SeasonTotals } from '@/db/read';
import { formatPesos, todayLocal } from '@/db/units';
import { useI18n } from '@/i18n';
import { formatDate, formatDateLong } from '@/i18n/dates';
import { statusLabel } from '@/i18n/labels';
import { color, radius, space } from '@/theme/tokens';
import { Chip, PhotoHero, Text } from '@/ui';

const HERO_PHOTO = require('../../assets/images/hero-field.jpg');

/** The prototype's 128×110 schedule cards, widened for the app's larger type. */
const CARD_WIDTH = 150;
const CARD_HEIGHT = 128;

/** The first card's green: the prototype's radial gradient, dark corner to light. */
const FEATURED = ['#0C3B32', '#396F39', '#66A240'] as const;

/**
 * Home's hero, laid out as the prototype's: a row with the big figure on the
 * left and two lines on the right, pills beneath, then a row of cards. The
 * prototype's temperature becomes the season's earnings, its weather lines
 * become sold and spent, its pills are the date and barangay, and its
 * schedule cards are what is planted now. Weather joins in step 8.
 */
export function HomeHero({
  season,
  cycles,
}: {
  season: SeasonTotals;
  cycles: readonly CycleSummary[];
}) {
  const { t, language } = useI18n();
  const router = useRouter();
  const { session } = useSession();
  const barangay = session?.profile?.barangay;
  const hasMoney = season.revenueCentavos > 0 || season.expenseCentavos > 0;

  return (
    <PhotoHero source={HERO_PHOTO}>
      <View style={styles.figureRow}>
        <View style={styles.figure}>
          <Text tone="onBrand">{t('homeEarningsLabel')}</Text>
          <Text variant="display" tone="onBrand" numeric>
            {formatPesos(season.netCentavos)}
          </Text>
        </View>
        {hasMoney ? (
          <View style={styles.side}>
            <Text tone="onBrand" numeric>
              {t('homeSold')} {formatPesos(season.revenueCentavos)}
            </Text>
            <Text tone="onBrand" numeric>
              {t('homeSpent')} {formatPesos(season.expenseCentavos)}
            </Text>
          </View>
        ) : null}
      </View>
      {hasMoney ? null : (
        <Text tone="onBrand" style={styles.inset}>
          {t('homeEarningsEmpty')}
        </Text>
      )}

      <View style={[styles.chips, styles.inset]}>
        <Chip tone="onCard" icon={CalendarDays} label={formatDateLong(todayLocal(), language)} />
        {barangay ? <Chip tone="onCard" icon={MapPin} label={barangay} /> : null}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityLabel={t('heroPlantings')}
        contentContainerStyle={styles.cards}
      >
        {cycles.length ? (
          cycles.map((cycle, index) => (
            <HeroCard
              key={cycle.id}
              featured={index === 0}
              icon={Clock}
              meta={t('plotPlanted', { date: formatDate(cycle.plantedOn, language) })}
              title={`${cropName(cycle, language)}, ${cycle.plotName}`}
              status={statusLabel(t, cycle.status)}
              onPress={() => router.push(`/plot/${cycle.plotId}`)}
            />
          ))
        ) : (
          <HeroCard
            featured
            icon={Plus}
            meta={t('heroPlantings')}
            title={t('noCycleAction')}
            onPress={() =>
              router.push({ pathname: '/record/[kind]', params: { kind: 'planting' } })
            }
          />
        )}
      </ScrollView>
    </PhotoHero>
  );
}

/**
 * One of the prototype's schedule cards: a small icon line, a title, and a
 * status pill at the bottom. The first is the green one, the rest white.
 */
function HeroCard({
  icon: Icon,
  meta,
  title,
  status,
  featured,
  onPress,
}: {
  icon: typeof Clock;
  meta: string;
  title: string;
  status?: string;
  featured: boolean;
  onPress: () => void;
}) {
  const tone = featured ? 'onBrand' : 'default';
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[title, meta, status].filter(Boolean).join(', ')}
      style={({ pressed }) => [
        styles.card,
        featured ? null : styles.plain,
        pressed && styles.pressed,
      ]}
    >
      {featured ? (
        <LinearGradient
          colors={FEATURED}
          start={{ x: 0.1, y: 0.1 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View style={styles.cardTop}>
        <View style={styles.meta}>
          <Icon size={12} color={featured ? color.textOnBrand : color.text} />
          <Text variant="label" tone={tone} numberOfLines={1} style={styles.flex}>
            {meta}
          </Text>
        </View>
        <Text tone={tone} numberOfLines={3}>
          {title}
        </Text>
      </View>
      {status ? (
        <View style={[styles.status, featured ? styles.statusOnGreen : styles.statusOnWhite]}>
          <Text variant="label" tone="accent">
            {status}
          </Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  inset: { paddingHorizontal: space.xl },
  figureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.md,
    paddingHorizontal: space.xl,
  },
  figure: { flexShrink: 1 },
  side: { alignItems: 'flex-end', gap: space.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  cards: {
    gap: space.sm,
    paddingHorizontal: space.lg,
    paddingVertical: space.md,
  },
  card: {
    width: CARD_WIDTH,
    minHeight: CARD_HEIGHT,
    paddingHorizontal: space.md,
    paddingVertical: space.sm,
    borderRadius: radius.card,
    justifyContent: 'space-between',
    gap: space.sm,
    overflow: 'hidden',
  },
  plain: {
    backgroundColor: color.surface,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: color.border,
  },
  pressed: { opacity: 0.85 },
  cardTop: { gap: space.sm },
  meta: { flexDirection: 'row', alignItems: 'center', gap: space.xs },
  flex: { flex: 1 },
  status: {
    alignSelf: 'flex-start',
    paddingHorizontal: space.sm,
    paddingVertical: space.xs,
    borderRadius: radius.pill,
  },
  statusOnGreen: { backgroundColor: color.surface },
  statusOnWhite: { backgroundColor: color.background },
});
