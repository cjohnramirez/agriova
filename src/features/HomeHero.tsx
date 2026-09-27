import { LinearGradient } from 'expo-linear-gradient';
import { useRouter } from 'expo-router';
import { CalendarDays, MapPin, Plus, Sprout } from 'lucide-react-native';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';

import { useSession } from '@/auth/SessionProvider';
import { cropName, type CycleSummary, type SeasonTotals } from '@/db/read';
import { formatPesos, todayLocal } from '@/db/units';
import { useI18n } from '@/i18n';
import { formatDateLong } from '@/i18n/dates';
import { statusLabel } from '@/i18n/labels';
import { color, gradient, layout, radius, space } from '@/theme/tokens';
import { Chip, PhotoHero, Text } from '@/ui';

const HERO_PHOTO = require('../../assets/images/hero-field.jpg');
/** Wide enough for "Kalabasa" and a plot name on two lines at 1.3x text. */
const CARD_WIDTH = 176;

/**
 * Home's hero, in the prototype's composition: the field photo, the date
 * and barangay as pills, the big figure, and a row of cards for what is
 * on the land. The prototype's temperature becomes the season's earnings, the
 * number farmers asked for; weather joins in step 8.
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
      <View style={styles.chips}>
        <Chip tone="onCard" icon={CalendarDays} label={formatDateLong(todayLocal(), language)} />
        {barangay ? <Chip tone="onCard" icon={MapPin} label={barangay} /> : null}
      </View>

      <View style={styles.text}>
        <Text tone="onBrand">{t('homeEarningsLabel')}</Text>
        <Text variant="display" tone="onBrand" numeric>
          {formatPesos(season.netCentavos)}
        </Text>
        {hasMoney ? (
          <View style={styles.split}>
            <Text tone="onBrand" numeric>
              {t('homeSold')} {formatPesos(season.revenueCentavos)}
            </Text>
            <Text tone="onBrand" numeric>
              {t('homeSpent')} {formatPesos(season.expenseCentavos)}
            </Text>
          </View>
        ) : (
          <Text tone="onBrand">{t('homeEarningsEmpty')}</Text>
        )}
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        accessibilityLabel={t('heroPlantings')}
        style={styles.rail}
        contentContainerStyle={styles.cards}
      >
        {cycles.length ? (
          cycles.map((cycle, index) => (
            <HeroCard
              key={cycle.id}
              featured={index === 0}
              title={cropName(cycle, language)}
              subtitle={cycle.plotName}
              status={statusLabel(t, cycle.status)}
              onPress={() => router.push(`/plot/${cycle.plotId}`)}
            />
          ))
        ) : (
          <HeroCard
            featured
            icon="add"
            title={t('noCycleAction')}
            subtitle={t('heroPlantings')}
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
 * One card in the hero's rail: the prototype's task cards, here a planting.
 * The first is the green one, the rest white, as in the design.
 */
function HeroCard({
  title,
  subtitle,
  status,
  featured,
  icon = 'crop',
  onPress,
}: {
  title: string;
  subtitle: string;
  status?: string;
  featured: boolean;
  icon?: 'crop' | 'add';
  onPress: () => void;
}) {
  const tone = featured ? 'onBrand' : 'default';
  const Icon = icon === 'add' ? Plus : Sprout;
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={[title, subtitle, status].filter(Boolean).join(', ')}
      style={({ pressed }) => [
        styles.card,
        featured ? styles.featured : styles.plain,
        pressed && styles.pressed,
      ]}
    >
      {featured ? (
        <LinearGradient
          colors={gradient.brand}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <Icon size={20} color={featured ? color.textOnBrand : color.accent} strokeWidth={2} />
      <Text variant="bodyStrong" tone={tone} numberOfLines={2}>
        {title}
      </Text>
      <Text tone={featured ? 'onBrand' : 'muted'} numberOfLines={2}>
        {subtitle}
      </Text>
      {status ? <Chip tone={featured ? 'onCard' : 'default'} label={status} /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  text: { gap: space.xs },
  split: { flexDirection: 'row', flexWrap: 'wrap', columnGap: space.lg, rowGap: space.xs },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: space.sm },
  // The rail scrolls under the screen edges, like the prototype's cut-off third card.
  rail: { marginHorizontal: layout.bleed },
  cards: { gap: space.md, paddingHorizontal: layout.screenPadding },
  card: {
    width: CARD_WIDTH,
    minHeight: layout.minTouch,
    padding: space.md,
    gap: space.xs,
    borderRadius: radius.lg,
    alignItems: 'flex-start',
    overflow: 'hidden',
  },
  featured: { backgroundColor: color.brand },
  plain: { backgroundColor: color.surface },
  pressed: { opacity: 0.8 },
});
