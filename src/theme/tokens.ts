import type { TextStyle } from 'react-native';

/**
 * Design tokens for Agriova.
 *
 * Colors, radii and the typeface come from the Figma "Unified Design" prototype
 * so the visual language carries over. The type scale deliberately does NOT:
 * the prototype sets most copy at 11px, which is unreadable for the target user
 * (average age 57, about 8 years of schooling, working outdoors in sunlight).
 * The floors below are the correction.
 */

export const color = {
  /** Deep green for the hero and feature cards. Gradient start. */
  brandDark: '#123F2E',
  brand: '#184933',
  brandLight: '#215335',
  /** Gradient end of the green cards, sampled from the prototype render. */
  brandGlow: '#548E3D',
  /** Accent green from the active tab, chips and figures on white. */
  accent: '#1A4A01',
  /** Brighter green reserved for primary actions, for contrast against white. */
  action: '#2E7D32',
  actionPressed: '#24642A',
  /** Tint behind a selected chip or tab, so selection never relies on color alone. */
  accentSoft: '#E6EFE3',

  surface: '#FFFFFF',
  background: '#F7F7F7',
  border: '#ECECEC',
  /** Translucent white for chips and dividers sitting on a green or red card. */
  onBrandSoft: 'rgba(255,255,255,0.15)',

  text: '#1F1F1F',
  textMuted: '#6B6B6B',
  textFaint: '#A8A8A8',
  textOnBrand: '#FFFFFF',

  danger: '#A02C1A',
  /**
   * Warning card gradient end. The prototype's #BD3E2A to #EC5A44 fails 4.5:1
   * for white body text by mid-card; this pair holds it to three quarters.
   */
  dangerGlow: '#D9503A',
  warning: '#E8A13A',
  /** Calm blue-grey for the offline banner. Offline is not an error state. */
  info: '#4A5B6A',
} as const;

/** Gradient pairs for `GradientCard`. Top-left to bottom-right, as in Figma. */
export const gradient = {
  brand: [color.brandDark, color.brandGlow],
  danger: [color.danger, color.dangerGlow],
} as const;

export type GradientName = keyof typeof gradient;

/**
 * The brand-green tint laid over the Home hero photo. Text sits only in the
 * top `textZone` of the hero, where the tint is `strong`; below that it fades
 * to `soft` so the field shows through behind the cards. The token test holds
 * white text at AA over a pure white patch of sky under the strong tint.
 */
export const scrim = { color: color.brandDark, strong: 0.72, soft: 0.2, textZone: 0.6 } as const;

/**
 * Geist, the prototype's typeface. Each weight is its own family because
 * Android cannot synthesise weights for a custom font; `fontWeight` is never
 * set alongside these.
 */
export const font = {
  regular: 'Geist_400Regular',
  medium: 'Geist_500Medium',
  semibold: 'Geist_600SemiBold',
  bold: 'Geist_700Bold',
} as const;

/**
 * The type ramp: compact, close to the prototype's density. An earlier ramp
 * set body at 18 for older readers outdoors; it made screens feel oversized and
 * was cut to this at review. The phone's own font-size setting still scales
 * everything for those who need it larger.
 *
 * `label` is the smallest style and exists only for non-essential text; it
 * must never carry a peso amount, a date, or a quantity. Line heights sit
 * around 1.3x so wrapped Bisaya, which runs longer than English, stays readable.
 */
export const type = {
  /** The peso total on the home hero. The number is the product. */
  display: { fontFamily: font.bold, fontSize: 34, lineHeight: 42 },
  /** Peso figures and quantities inside cards. */
  figure: { fontFamily: font.semibold, fontSize: 26, lineHeight: 32 },
  /** Screen titles. */
  title: { fontFamily: font.bold, fontSize: 20, lineHeight: 26 },
  /** Section titles and card headings. */
  heading: { fontFamily: font.semibold, fontSize: 17, lineHeight: 22 },
  /** Emphasised body: list item titles, button labels. */
  bodyStrong: { fontFamily: font.medium, fontSize: 15, lineHeight: 20 },
  body: { fontFamily: font.regular, fontSize: 15, lineHeight: 20 },
  /** Chips, captions, tab labels. Never essential information. */
  label: { fontFamily: font.medium, fontSize: 13, lineHeight: 18 },
} as const satisfies Record<string, TextStyle>;

export type TypeVariant = keyof typeof type;

export const space = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  xxl: 32,
} as const;

/** Figma uses 20 for cards and 10 for elements inside them. */
export const radius = {
  sm: 8,
  md: 10,
  lg: 16,
  card: 20,
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
  /** Content stops growing here on tablets, so lines stay a readable length. */
  maxContentWidth: 600,
  /** Below this width, two-up tiles stack into one column. */
  narrowWidth: 380,
  /** Scroll content ends this far above the screen bottom, clearing the tab bar. */
  tabBarClearance: 96,
  /** Pulls a full-bleed element, like the hero photo, out to the screen edges. */
  bleed: -space.lg,
} as const;
