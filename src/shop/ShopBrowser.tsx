import { Search } from 'lucide-react-native';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';

import { formatPesos } from '@/db/units';
import { useI18n } from '@/i18n';
import { color, space } from '@/theme/tokens';
import { FilterPills, ProductCard, Text, TextField, useBreakpoint } from '@/ui';

import { filterListings, type Listing, type ShopCategory } from './listings';

/**
 * Search, category pills and the product grid. Takes its listings as a prop so
 * a test can render a stocked shop before the marketplace backend exists.
 */
export function ShopBrowser({
  listings,
  onOpen,
}: {
  listings: readonly Listing[];
  onOpen: (listing: Listing) => void;
}) {
  const { t } = useI18n();
  const { isNarrow } = useBreakpoint();
  const [category, setCategory] = useState<ShopCategory | 'all'>('all');
  const [query, setQuery] = useState('');
  const shown = filterListings(listings, category, query);

  // Two columns, or one on a narrow screen or with large text.
  const perRow = isNarrow ? 1 : 2;
  const rows: Listing[][] = [];
  for (let i = 0; i < shown.length; i += perRow) rows.push(shown.slice(i, i + perRow));

  return (
    <>
      <TextField
        label={t('shopSearch')}
        value={query}
        onChangeText={setQuery}
        prefix={<Search size={22} color={color.textMuted} />}
        returnKeyType="search"
      />
      <FilterPills
        label={t('shopCategory')}
        selected={category}
        onSelect={setCategory}
        options={[
          { key: 'all', label: t('shopAll') },
          { key: 'seeds', label: t('shopSeeds') },
          { key: 'fertilizer', label: t('shopFertilizer') },
          { key: 'pesticide', label: t('shopPesticide') },
          { key: 'tools', label: t('shopTools') },
        ]}
      />
      <View style={styles.grid}>
        {rows.map((row) => (
          <View key={row[0].id} style={styles.row}>
            {row.map((listing) => (
              <ProductCard
                key={listing.id}
                name={listing.name}
                price={formatPesos(listing.priceCentavos)}
                per={t('shopPer', { unit: listing.per })}
                seller={listing.seller}
                photoUri={listing.photoUri}
                onPress={() => onOpen(listing)}
              />
            ))}
            {row.length < perRow ? <View style={styles.filler} /> : null}
          </View>
        ))}
        {shown.length === 0 ? (
          <Text tone="muted">{t('shopNoMatch', { query: query.trim() })}</Text>
        ) : null}
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  grid: { gap: space.md },
  row: { flexDirection: 'row', gap: space.md },
  filler: { flex: 1 },
});
