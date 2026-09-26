/**
 * Marketplace listings. They live on the server, not in the farmer's local
 * ledger, and arrive with Supabase in step 7; until then the shop has none
 * and shows its empty state.
 */

export type ShopCategory = 'seeds' | 'fertilizer' | 'pesticide' | 'tools';

export type Listing = {
  id: string;
  name: string;
  category: ShopCategory;
  priceCentavos: number;
  /** What one price buys, e.g. "18 kg bag". Written by the seller. */
  per: string;
  seller: string;
  photoUri: string | null;
};

export function useListings(): Listing[] {
  return NO_LISTINGS;
}

const NO_LISTINGS: Listing[] = [];

/** Case-insensitive match on name or seller, within a category. */
export function filterListings(
  listings: readonly Listing[],
  category: ShopCategory | 'all',
  query: string,
): Listing[] {
  const needle = query.trim().toLowerCase();
  return listings.filter(
    (l) =>
      (category === 'all' || l.category === category) &&
      (!needle || `${l.name} ${l.seller}`.toLowerCase().includes(needle)),
  );
}
