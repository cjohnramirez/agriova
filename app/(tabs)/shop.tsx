import { ShoppingBag } from 'lucide-react-native';

import { useI18n } from '@/i18n';
import { TabScreen } from '@/shell/TabScreen';
import { ShopBrowser } from '@/shop/ShopBrowser';
import { useListings } from '@/shop/listings';
import { EmptyState, SectionHeader } from '@/ui';

/**
 * The farm shop, from the prototype's Shop screen. Listings are online-first
 * and arrive with the marketplace backend in step 7.
 */
export default function Shop() {
  const { t } = useI18n();
  const listings = useListings();

  return (
    <TabScreen showRecord={false}>
      <SectionHeader title={t('shopTitle')} subtitle={t('shopSubtitle')} />
      {listings.length ? (
        // Product pages come with the marketplace; until then a tap does nothing.
        <ShopBrowser listings={listings} onOpen={() => {}} />
      ) : (
        <EmptyState icon={ShoppingBag} title={t('shopEmptyTitle')} body={t('shopEmptyBody')} />
      )}
    </TabScreen>
  );
}
