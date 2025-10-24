import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useMemo, useState } from 'react';
import { fallbackLocale, supportedLocales, translations } from './translations';
const I18nContext = createContext(undefined);
export function I18nProvider({ children, defaultLocale = fallbackLocale }) {
    const [locale, setLocale] = useState(defaultLocale);
    const value = useMemo(() => {
        const translate = (key, values) => {
            const dictionary = translations[locale] ?? translations[fallbackLocale];
            const fallbackDictionary = translations[fallbackLocale];
            const template = dictionary[key] ?? fallbackDictionary[key] ?? key;
            if (!values) {
                return template;
            }
            return template.replace(/\{(\w+)\}/g, (_, token) => {
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
    return _jsx(I18nContext.Provider, { value: value, children: children });
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
