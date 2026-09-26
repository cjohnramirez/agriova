import { useRouter } from 'expo-router';

import { formatPesos } from '@/db/units';
import { useI18n } from '@/i18n';
import { TabScreen } from '@/shell/TabScreen';
import { GradientCard, Text } from '@/ui';

/**
 * Home. The season's net earnings is the first thing on screen because it is
 * the need farmers named most: "I will finally know if I am earning." Wired to
 * `cycle_pnl` in step 5; zero until then.
 */
export default function Home() {
  const { t } = useI18n();
  const router = useRouter();

  return (
    <TabScreen>
      <GradientCard padding="hero">
        <Text tone="onBrand">{t('homeEarningsLabel')}</Text>
        <Text variant="display" tone="onBrand" numeric>
          {formatPesos(0)}
        </Text>
        <Text tone="onBrand" onPress={() => router.push('/record')}>
          {t('homeEarningsEmpty')}
        </Text>
      </GradientCard>
    </TabScreen>
  );
}
