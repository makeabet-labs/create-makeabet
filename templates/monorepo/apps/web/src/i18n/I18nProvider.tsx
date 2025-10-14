import { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { fallbackLocale, Locale, supportedLocales, translations } from './translations';

type TranslationValues = Record<string, string | number>;

type I18nContextValue = {
  locale: Locale;
  locales: readonly Locale[];
  setLocale: (locale: Locale) => void;
  t: (key: string, values?: TranslationValues) => string;
};

const I18nContext = createContext<I18nContextValue | undefined>(undefined);

type I18nProviderProps = {
  children: ReactNode;
  defaultLocale?: Locale;
};

export function I18nProvider({ children, defaultLocale = fallbackLocale }: I18nProviderProps) {
  const [locale, setLocale] = useState<Locale>(defaultLocale);

  const value = useMemo<I18nContextValue>(() => {
    const translate = (key: string, values?: TranslationValues) => {
      const dictionary = translations[locale] ?? translations[fallbackLocale];
      const fallbackDictionary = translations[fallbackLocale];
      const template = dictionary[key] ?? fallbackDictionary[key] ?? key;

      if (!values) {
        return template;
      }

      return template.replace(/\{(\w+)\}/g, (_, token: string) => {
        const replacement = values[token];
        return replacement !== undefined ? String(replacement) : `{${token}}`;
      });
    };

    return {
      locale,
      locales: supportedLocales,
      setLocale,
      t: translate,
    };
  }, [locale]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}

export function useTranslation() {
  const { t } = useI18n();
  return { t };
}
