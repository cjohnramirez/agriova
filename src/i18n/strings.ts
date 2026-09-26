/**
 * String catalog. Bisaya (Cebuano) is the default because the pilot is in
 * Cagayan de Oro barangays; English is the fallback and the toggle.
 *
 * Keys are grouped by screen. Every user-visible string in the app must come
 * from here, with no exceptions, so that a translation pass is a single-file
 * review rather than a hunt through components.
 *
 * Bisaya strings added in the step 4 rebuild (welcome through settings) were
 * drafted without a native speaker and need a review before the pilot.
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
  back: 'Back',
  continue: 'Continue',
  cancel: 'Cancel',
  comingSoon: 'Being built',
  dbErrorTitle: 'Your records could not be opened',
  offlineBanner: 'No signal. Your records are saved and will send later.',

  welcomeTitle: 'Welcome to Agriova',
  welcomeBody: 'Know what your farm earns, every season.',
  welcomeLanguage: 'Choose your language',

  loginTitle: 'Your mobile number',
  loginSubtitle: 'We use it to keep your records safe.',
  loginPhoneLabel: 'Mobile number',
  loginPhoneHint: 'We will text you a 6-digit code.',
  loginCodeTitle: 'Enter the code',
  loginCodeSubtitle: 'We sent a 6-digit code to {phone}.',
  loginVerify: 'Confirm',
  loginResend: 'Send the code again',
  loginChangeNumber: 'Change number',
  loginInvalidPhone: 'Enter a 10-digit number starting with 9.',
  loginInvalidCode: 'The code must be 6 digits.',

  profileTitle: 'Tell us about you',
  profileName: 'Your name',
  profileBarangay: 'Barangay',
  profileBarangayHint: 'Where your farm is.',
  profileRequired: 'Please fill this in.',

  plotTitle: 'Add your first plot',
  plotBody: 'A plot is a piece of land you farm. You can add more later.',
  plotName: 'Plot name',
  plotNamePlaceholder: 'e.g. Near the river',
  plotArea: 'Size in square metres',
  plotAreaHint: 'Optional. Leave it blank if you are not sure.',
  plotSave: 'Save plot',
  plotSkip: 'Skip for now',
  plotSaveFailed: 'The plot could not be saved. Try again.',

  tabHome: 'Home',
  tabFields: 'Fields',
  tabActivity: 'Activity',
  tabAssistant: 'Assistant',
  tabShop: 'Shop',

  topGreeting: 'Welcome back',
  topSettings: 'Account settings',
  topNotifications: 'Notifications',

  homeEarningsLabel: 'Your earnings this season',
  homeEarningsEmpty: 'Record a sale and your earnings will show here.',

  fieldsEmptyTitle: 'Your fields',
  fieldsEmptyBody: 'Your plots and what is growing on them will show here.',
  activityEmptyTitle: 'Nothing planned today',
  activityEmptyBody: 'Tasks and heat warnings for your farm will show here.',
  assistantTitle: 'Farm assistant',
  assistantBody: 'Ask questions about your farm. Coming soon.',
  shopEmptyTitle: 'Farm shop',
  shopEmptyBody: 'Seeds, fertilizer and tools from nearby sellers. Coming soon.',

  recordButton: 'Record',
  recordTitle: 'What do you want to record?',
  recordExpense: 'Expense',
  recordExpenseHint: 'Money you spent on the farm',
  recordHarvest: 'Harvest',
  recordHarvestHint: 'Produce you picked',
  recordSale: 'Sale',
  recordSaleHint: 'Produce you sold',

  settingsTitle: 'Account and settings',
  settingsLanguage: 'Language',
  settingsHelp: 'Help center',
  settingsAbout: 'About Agriova',
  settingsLogout: 'Log out',
  settingsLogoutConfirm: 'Log out of Agriova? Records not yet sent will be lost.',
  settingsDelete: 'Delete my account',
  settingsDeleteConfirm:
    'This removes your account and every record on this phone. It cannot be undone.',
  settingsDeleteAction: 'Delete',

  notificationsTitle: 'Notifications',
  notificationsEmpty: 'No notifications yet.',
} as const;

/** Keys come from the English catalog; values are plain strings, not literals. */
export type StringKey = keyof typeof en;
type Catalog = Record<StringKey, string>;

const bis: Catalog = {
  appName: 'Agriova',
  tagline: 'Ang imong uma, naihap',
  back: 'Balik',
  continue: 'Padayon',
  cancel: 'Ayaw na',
  comingSoon: 'Ginahimo pa',
  dbErrorTitle: 'Dili maablihan ang datos',
  offlineBanner: 'Walay signal. Natipigan ang imong sinulat, ipadala ra unya.',

  welcomeTitle: 'Maayong pag-abot sa Agriova',
  welcomeBody: 'Hibaloa ang kita sa imong uma, matag tinguha.',
  welcomeLanguage: 'Pilia ang imong pinulongan',

  loginTitle: 'Imong numero sa cellphone',
  loginSubtitle: 'Gamiton namo kini aron luwas ang imong mga sinulat.',
  loginPhoneLabel: 'Numero sa cellphone',
  loginPhoneHint: 'Padad-an ka namo ug 6 ka numero nga code.',
  loginCodeTitle: 'Isulat ang code',
  loginCodeSubtitle: 'Gipadala namo ang code sa {phone}.',
  loginVerify: 'Kumpirmahon',
  loginResend: 'Ipadala usab ang code',
  loginChangeNumber: 'Ilisi ang numero',
  loginInvalidPhone: 'Isulat ang 10 ka numero nga magsugod sa 9.',
  loginInvalidCode: 'Ang code kinahanglan 6 ka numero.',

  profileTitle: 'Isulti bahin nimo',
  profileName: 'Imong ngalan',
  profileBarangay: 'Barangay',
  profileBarangayHint: 'Asa nahimutang ang imong uma.',
  profileRequired: 'Palihug isulat kini.',

  plotTitle: 'Idugang ang imong unang luna',
  plotBody: 'Ang luna kay ang yuta nga imong ginauma. Makadugang ka pa unya.',
  plotName: 'Ngalan sa luna',
  plotNamePlaceholder: 'Pananglitan: Duol sa suba',
  plotArea: 'Gidak-on sa square metro',
  plotAreaHint: 'Dili kinahanglan. Biyai kung dili ka sigurado.',
  plotSave: 'Tipigi ang luna',
  plotSkip: 'Unya na lang',
  plotSaveFailed: 'Wala natipigi ang luna. Sulayi pag-usab.',

  tabHome: 'Panimalay',
  tabFields: 'Uma',
  tabActivity: 'Buluhaton',
  tabAssistant: 'Katabang',
  tabShop: 'Tindahan',

  topGreeting: 'Maayong pagbalik',
  topSettings: 'Account ug settings',
  topNotifications: 'Mga pahibalo',

  homeEarningsLabel: 'Imong kita karong tinguha',
  homeEarningsEmpty: 'Isulat ang imong baligya ug makita nimo dinhi ang kita.',

  fieldsEmptyTitle: 'Imong mga uma',
  fieldsEmptyBody: 'Makita dinhi ang imong mga luna ug ang gitanom niini.',
  activityEmptyTitle: 'Walay plano karon',
  activityEmptyBody: 'Makita dinhi ang mga buluhaton ug pasidaan sa kainit.',
  assistantTitle: 'Katabang sa uma',
  assistantBody: 'Pangutana bahin sa imong uma. Umaabot na.',
  shopEmptyTitle: 'Tindahan sa uma',
  shopEmptyBody: 'Binhi, abono ug gamit gikan sa duol nga tindera. Umaabot na.',

  recordButton: 'Itala',
  recordTitle: 'Unsa ang imong itala?',
  recordExpense: 'Gasto',
  recordExpenseHint: 'Kwarta nga imong nagasto sa uma',
  recordHarvest: 'Ani',
  recordHarvestHint: 'Abot nga imong naani',
  recordSale: 'Baligya',
  recordSaleHint: 'Abot nga imong nabaligya',

  settingsTitle: 'Account ug settings',
  settingsLanguage: 'Pinulongan',
  settingsHelp: 'Tabang',
  settingsAbout: 'Bahin sa Agriova',
  settingsLogout: 'Gawas',
  settingsLogoutConfirm: 'Mogawas sa Agriova? Mawala ang wala pa maipadala nga sinulat.',
  settingsDelete: 'Papasa ang akong account',
  settingsDeleteConfirm:
    'Mapapas ang imong account ug tanang sinulat niining cellphone. Dili na kini mabalik.',
  settingsDeleteAction: 'Papasa',

  notificationsTitle: 'Mga pahibalo',
  notificationsEmpty: 'Wala pay pahibalo.',
};

export const catalogs: Record<Language, Catalog> = { bis, en };
