import { getLocales } from 'expo-localization';
import * as SecureStore from 'expo-secure-store';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

import { catalogs, LANGUAGES, type Language, type StringKey } from './strings';

export { LANGUAGES, LANGUAGE_NAMES, type Language } from './strings';

const STORAGE_KEY = 'agriova.language';

/**
 * Picks the starting language from the device. Anything other than an explicit
 * English device falls back to Bisaya, since the pilot audience is Cebuano
 * speaking and a farmer who never changes settings should not land in English.
 */
function detectLanguage(): Language {
  const primary = getLocales()[0]?.languageCode;
  return primary === 'en' ? 'en' : 'bis';
}

export type Translate = (key: StringKey, vars?: Record<string, string | number>) => string;

type I18nValue = {
  language: Language;
  setLanguage: (next: Language) => void;
  t: Translate;
};

const I18nContext = createContext<I18nValue | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detectLanguage);

  // A saved choice beats the device language. Read once; failures keep the default.
  useEffect(() => {
    SecureStore.getItemAsync(STORAGE_KEY)
      .then((saved) => {
        if (saved && (LANGUAGES as readonly string[]).includes(saved)) {
          setLanguageState(saved as Language);
        }
      })
      .catch(() => {});
  }, []);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    SecureStore.setItemAsync(STORAGE_KEY, next).catch(() => {});
  }, []);

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

  const value = useMemo(() => ({ language, setLanguage, t }), [language, setLanguage, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n(): I18nValue {
  const value = useContext(I18nContext);
  if (!value) throw new Error('useI18n must be used inside I18nProvider');
  return value;
}
