/**
 * Design tokens for Agriova.
 *
 * Colors are sampled from the existing Figma prototype so the visual language
 * carries over. Type and spacing scales deliberately do NOT carry over: the
 * prototype sets most body copy at roughly 8-9px, which is unreadable for the
 * target user (average age 57, about 8 years of schooling, working outdoors in
 * sunlight). The floors below are the correction.
 */

export const color = {
  /** Deep green used for the hero and feature cards, as a gradient pair. */
  brandDark: '#123F2E',
  brand: '#184933',
  brandLight: '#215335',
  /** Accent green from the active tab and status pills. */
  accent: '#1A4A01',
  /** Brighter green reserved for primary actions, for contrast against white. */
  action: '#2E7D32',
  actionPressed: '#24642A',

  surface: '#FFFFFF',
  background: '#F7F7F7',
  border: '#ECECEC',

  text: '#1F1F1F',
  textMuted: '#7F7F7F',
  textFaint: '#A8A8A8',
  textOnBrand: '#FFFFFF',

  danger: '#A02C1A',
  dangerLight: '#C4422E',
  warning: '#E8A13A',
  /** Calm blue-grey for the offline banner. Offline is not an error state. */
  info: '#4A5B6A',
} as const;

/**
 * Minimum 18 for anything a farmer must read. `caption` is the smallest size in
 * the system and exists only for non-essential labels; it must never carry a
 * peso amount, a date, or a quantity.
 */
export const fontSize = {
  caption: 15,
  body: 18,
  bodyLarge: 20,
  title: 24,
  heading: 28,
  /** Peso figures and quantities. The number is the product. */
  figure: 40,
  figureHero: 52,
} as const;

export const fontWeight = {
  regular: '400',
  medium: '500',
  semibold: '600',
  bold: '700',
} as const;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
} as const;

/**
 * Every interactive element must be at least `minTouch` on both axes. 56 rather
 * than the usual 44 because the target user is older and often has calloused or
 * wet hands.
 */
export const layout = {
  minTouch: 56,
  screenPadding: space.lg,
  tabBarHeight: 68,
} as const;
