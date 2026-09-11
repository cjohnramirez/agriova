/**
 * String catalog. Bisaya (Cebuano) is the default because the pilot is in
 * Cagayan de Oro barangays; English is the fallback and the toggle.
 *
 * Keys are grouped by screen. Every user-visible string in the app must come
 * from here, with no exceptions, so that a translation pass is a single-file
 * review rather than a hunt through components.
 */

export const LANGUAGES = ['bis', 'en'] as const;
export type Language = (typeof LANGUAGES)[number];

export const LANGUAGE_NAMES: Record<Language, string> = {
  bis: 'Binisaya',
  en: 'English',
};

const en = {
  appName: 'Agriova',
  tagline: 'Your farm, counted',

  tabHome: 'Home',
  tabFarm: 'Farm',
  tabMarket: 'Market',
  tabMe: 'Me',

  loginTitle: 'Welcome',
  loginSubtitle: 'Enter your mobile number to start.',
  loginPhoneLabel: 'Mobile number',
  loginPhoneHint: 'We will text you a 6-digit code.',
  loginContinue: 'Continue',
  loginCodeTitle: 'Enter the code',
  loginCodeSubtitle: 'We sent a 6-digit code to {phone}.',
  loginVerify: 'Confirm',
  loginResend: 'Send the code again',
  loginBack: 'Back',
  loginInvalidPhone: 'Enter a 10-digit number starting with 9.',
  loginInvalidCode: 'The code must be 6 digits.',

  homeEarningsLabel: 'Your earnings this season',
  homeEarningsEmpty: 'Record a sale and your earnings will show here.',

  farmTitle: 'My farm',
  farmEmpty: 'No plots yet.',

  marketTitle: 'Market',
  marketEmpty: 'Nothing listed for sale yet.',

  meTitle: 'My account',
  meLanguage: 'Language',

  comingSoon: 'Being built',
  offlineBanner: 'No signal. Your records are saved and will send later.',
} as const;

/** Keys come from the English catalog; values are plain strings, not literals. */
export type StringKey = keyof typeof en;
type Catalog = Record<StringKey, string>;

const bis: Catalog = {
  appName: 'Agriova',
  tagline: 'Ang imong uma, naihap',

  tabHome: 'Panimalay',
  tabFarm: 'Uma',
  tabMarket: 'Tindahan',
  tabMe: 'Ako',

  loginTitle: 'Maayong pag-abot',
  loginSubtitle: 'Isulat ang imong numero aron magsugod.',
  loginPhoneLabel: 'Numero sa cellphone',
  loginPhoneHint: 'Padad-an ka namo ug 6 ka numero nga code.',
  loginContinue: 'Padayon',
  loginCodeTitle: 'Isulat ang code',
  loginCodeSubtitle: 'Gipadala namo ang code sa {phone}.',
  loginVerify: 'Kumpirmahon',
  loginResend: 'Ipadala usab ang code',
  loginBack: 'Balik',
  loginInvalidPhone: 'Isulat ang 10 ka numero nga magsugod sa 9.',
  loginInvalidCode: 'Ang code kinahanglan 6 ka numero.',

  homeEarningsLabel: 'Imong kita karong tinguha',
  homeEarningsEmpty: 'Isulat ang imong baligya ug makita nimo dinhi ang kita.',

  farmTitle: 'Akong uma',
  farmEmpty: 'Wala pa\'y luna nga nasulat.',

  marketTitle: 'Tindahan',
  marketEmpty: 'Wala pa\'y gibaligya.',

  meTitle: 'Akong account',
  meLanguage: 'Pinulongan',

  comingSoon: 'Ginahimo pa',
  offlineBanner: 'Walay signal. Natipigan ang imong sinulat, ipadala ra unya.',
};

export const catalogs: Record<Language, Catalog> = { bis, en };
