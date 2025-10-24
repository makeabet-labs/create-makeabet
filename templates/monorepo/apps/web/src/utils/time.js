import { formatDistanceToNowStrict } from 'date-fns';
import { enUS, zhTW } from 'date-fns/locale';
const localeMap = {
    en: enUS,
    'zh-TW': zhTW,
};
export function formatDistanceToNow(value, locale = 'en') {
    try {
        const resolvedLocale = localeMap[locale] ?? enUS;
        return formatDistanceToNowStrict(new Date(value), { addSuffix: false, locale: resolvedLocale });
    }
    catch (error) {
        return locale === 'zh-TW' ? '未知時間' : 'Unknown time';
    }
}
