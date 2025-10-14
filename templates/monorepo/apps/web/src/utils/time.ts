import { formatDistanceToNowStrict } from 'date-fns';
import type { Locale as DateFnsLocale } from 'date-fns';
import { enUS, zhTW } from 'date-fns/locale';
import type { Locale as SupportedLocale } from '../i18n';

type DateInput = string | number | Date;

const localeMap: Record<SupportedLocale, DateFnsLocale> = {
  en: enUS,
  'zh-TW': zhTW,
};

export function formatDistanceToNow(value: DateInput, locale: SupportedLocale = 'en'): string {
  try {
    const resolvedLocale = localeMap[locale] ?? enUS;
    return formatDistanceToNowStrict(new Date(value), { addSuffix: false, locale: resolvedLocale });
  } catch (error) {
    return locale === 'zh-TW' ? '未知時間' : 'Unknown time';
  }
}
