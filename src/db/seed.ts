import type { Unit } from './schema';

/**
 * Crops seeded on first launch so a brand new install is usable with no
 * connection at all. The server refreshes this list later; nothing here is
 * authoritative beyond the first run.
 *
 * The list is Misamis Oriental and Cagayan de Oro smallholder crops, drawn from
 * the produce named in the stakeholder interviews. Wheat, which appeared in the
 * original mockup, is not a Philippine smallholder crop and is absent on
 * purpose.
 *
 * `shelfLifeDays` is ambient post-harvest life with no cold chain, which is the
 * reality for the target user. It drives the spoilage alert, so these numbers
 * are deliberately conservative: warning a farmer two days early costs nothing,
 * warning them a day late costs them the harvest.
 *
 * Icons are Lucide names and are approximate. Lucide has no tomato, eggplant or
 * squash glyph, so several are visual stand-ins until the photographic tiles
 * the design calls for are shot.
 */
export type SeedCrop = {
  id: string;
  nameBis: string;
  nameEn: string;
  icon: string;
  shelfLifeDays: number;
  defaultUnit: Unit;
};

export const SEED_CROPS: readonly SeedCrop[] = [
  // Staples, sold by the sack and stored for months once dried.
  { id: 'crop-rice', nameBis: 'Humay', nameEn: 'Rice', icon: 'Wheat', shelfLifeDays: 365, defaultUnit: 'sack' },
  { id: 'crop-corn', nameBis: 'Mais', nameEn: 'Corn', icon: 'Popcorn', shelfLifeDays: 180, defaultUnit: 'sack' },

  // Highly perishable. These are where the spoilage alert earns its keep, and
  // they are exactly the crops the fruit vendor interviews complained about.
  { id: 'crop-banana', nameBis: 'Saging', nameEn: 'Banana', icon: 'Banana', shelfLifeDays: 7, defaultUnit: 'kg' },
  { id: 'crop-papaya', nameBis: 'Kapayas', nameEn: 'Papaya', icon: 'Citrus', shelfLifeDays: 5, defaultUnit: 'kg' },
  { id: 'crop-mango', nameBis: 'Mangga', nameEn: 'Mango', icon: 'Apple', shelfLifeDays: 7, defaultUnit: 'kg' },
  { id: 'crop-tomato', nameBis: 'Kamatis', nameEn: 'Tomato', icon: 'Cherry', shelfLifeDays: 7, defaultUnit: 'kg' },
  { id: 'crop-okra', nameBis: 'Okra', nameEn: 'Okra', icon: 'Bean', shelfLifeDays: 5, defaultUnit: 'kg' },
  { id: 'crop-moringa', nameBis: 'Kamunggay', nameEn: 'Moringa', icon: 'Leaf', shelfLifeDays: 2, defaultUnit: 'bundle' },

  // Vegetables with a week or two of life.
  { id: 'crop-eggplant', nameBis: 'Talong', nameEn: 'Eggplant', icon: 'Vegan', shelfLifeDays: 7, defaultUnit: 'kg' },
  { id: 'crop-bittergourd', nameBis: 'Paliya', nameEn: 'Bitter gourd', icon: 'Shrub', shelfLifeDays: 7, defaultUnit: 'kg' },
  { id: 'crop-stringbean', nameBis: 'Batong', nameEn: 'String beans', icon: 'Bean', shelfLifeDays: 5, defaultUnit: 'bundle' },
  { id: 'crop-cabbage', nameBis: 'Repolyo', nameEn: 'Cabbage', icon: 'Salad', shelfLifeDays: 14, defaultUnit: 'kg' },
  { id: 'crop-chili', nameBis: 'Katumbal', nameEn: 'Chili', icon: 'Flame', shelfLifeDays: 10, defaultUnit: 'kg' },

  // Root crops and keepers.
  { id: 'crop-carrot', nameBis: 'Karot', nameEn: 'Carrot', icon: 'Carrot', shelfLifeDays: 21, defaultUnit: 'kg' },
  { id: 'crop-sweetpotato', nameBis: 'Kamote', nameEn: 'Sweet potato', icon: 'Nut', shelfLifeDays: 30, defaultUnit: 'kg' },
  { id: 'crop-squash', nameBis: 'Kalabasa', nameEn: 'Squash', icon: 'Grape', shelfLifeDays: 60, defaultUnit: 'kg' },
  { id: 'crop-onion', nameBis: 'Sibuyas', nameEn: 'Onion', icon: 'Soup', shelfLifeDays: 60, defaultUnit: 'kg' },
  { id: 'crop-ginger', nameBis: 'Luy-a', nameEn: 'Ginger', icon: 'Hop', shelfLifeDays: 60, defaultUnit: 'kg' },

  // Tree crops.
  { id: 'crop-coconut', nameBis: 'Lubi', nameEn: 'Coconut', icon: 'TreePalm', shelfLifeDays: 90, defaultUnit: 'piece' },
  { id: 'crop-coffee', nameBis: 'Kape', nameEn: 'Coffee', icon: 'Cookie', shelfLifeDays: 365, defaultUnit: 'sack' },
];
