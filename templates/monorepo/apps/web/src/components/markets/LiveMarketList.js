import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo } from 'react';
import { Badge, Card, Group, Paper, Progress, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconClockHour4, IconUsersGroup } from '@tabler/icons-react';
import { useI18n, useTranslation } from '../../i18n';
import { formatDistanceToNow } from '../../utils/time';
import { SECTION_MARKETS } from '../../data/markets';
export function LiveMarketList({ title, filter, onSelect }) {
    const { t } = useTranslation();
    const { locale } = useI18n();
    const markets = useMemo(() => SECTION_MARKETS[filter] ?? [], [filter]);
    return (_jsx(Paper, { radius: "lg", p: "xl", withBorder: true, children: _jsxs(Stack, { gap: "lg", children: [_jsxs(Group, { justify: "space-between", align: "center", children: [_jsx(Title, { order: 3, children: title }), _jsx(Badge, { variant: "light", color: "blue", children: t('markets.badge.beta') })] }), _jsx(SimpleGrid, { cols: { base: 1, md: 2 }, spacing: "lg", children: markets.map((market) => {
                        const probability = Math.round(market.odds * 100);
                        const titleLabel = t(market.titleKey);
                        const categoryLabel = t(market.categoryKey);
                        const closingIn = formatDistanceToNow(market.closingAt, locale);
                        const participantsCount = market.participants ?? 0;
                        const participantsLabel = t('markets.participants', { count: participantsCount });
                        const bullishShare = t('markets.bullishShare', { percentage: probability });
                        return (_jsx(Card, { padding: "lg", radius: "md", withBorder: true, onClick: () => onSelect?.({
                                id: market.id,
                                title: titleLabel,
                                category: categoryLabel,
                                odds: market.odds,
                                participants: market.participants,
                                closingAt: market.closingAt,
                            }), style: onSelect ? { cursor: 'pointer' } : undefined, children: _jsxs(Stack, { gap: "sm", children: [_jsxs(Group, { justify: "space-between", children: [_jsx(Text, { fw: 600, children: titleLabel }), _jsx(Badge, { variant: "dot", children: categoryLabel })] }), _jsxs(Group, { gap: "xs", c: "dimmed", fz: "sm", children: [_jsx(IconClockHour4, { size: 16 }), _jsx(Text, { children: t('markets.closingIn', { time: closingIn }) })] }), _jsx(Progress, { value: probability, radius: "lg", color: "violet" }), _jsxs(Group, { justify: "space-between", align: "center", children: [_jsxs(Group, { gap: "xs", c: "teal.4", fz: "sm", children: [_jsx(IconUsersGroup, { size: 16 }), _jsx(Text, { children: participantsLabel })] }), _jsx(Text, { fw: 700, children: bullishShare })] })] }) }, market.id));
                    }) })] }) }));
}
