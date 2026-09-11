import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';
import { getLocales } from 'expo-localization';

import { catalogs, LANGUAGES, type Language, type StringKey } from './strings';

export { LANGUAGES, LANGUAGE_NAMES, type Language } from './strings';

/**
 * Picks the starting language from the device. Anything other than an explicit
 * English device falls back to Bisaya, since the pilot audience is Cebuano
 * speaking and a farmer who never changes settings should not land in English.
 */
function detectLanguage(): Language {
  const primary = getLocales()[0]?.languageCode;
  return primary === 'en' ? 'en' : 'bis';
}

type Translate = (key: StringKey, vars?: Record<string, string | number>) => string;

type I18nValue = {
  language: Language;
  setLanguage: (next: Language) => void;
  t: Translate;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>(detectLanguage);

  const t = useCallback<Translate>(
    (key, vars) => {
      const template = catalogs[language][key] ?? catalogs.en[key] ?? key;
      if (!vars) return template;
      return Object.entries(vars).reduce(
        (out, [name, value]) => out.replaceAll(`{${name}}`, String(value)),
        template,
      );
    },
    [language],
  );

  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
