import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Badge, Card, Group, Progress, Stack, Text } from '@mantine/core';
import { useMemo } from 'react';
import { useI18n, useTranslation } from '../i18n';
import { formatDistanceToNow } from '../utils/time';
export function SpotlightCard({ market, onSelect }) {
    const { locale } = useI18n();
    const { t } = useTranslation();
    const probability = useMemo(() => Math.round(market.odds * 100), [market.odds]);
    const closingIn = useMemo(() => formatDistanceToNow(market.closingAt, locale), [market.closingAt, locale]);
    return (_jsx(Card, { withBorder: true, radius: "md", padding: "lg", onClick: () => onSelect?.(market.id), style: onSelect ? { cursor: 'pointer' } : undefined, children: _jsxs(Stack, { gap: "xs", children: [_jsxs(Group, { justify: "space-between", children: [_jsx(Text, { fw: 600, children: market.title }), _jsx(Badge, { variant: "light", color: "violet", children: market.category })] }), _jsx(Text, { c: "dimmed", fz: "sm", children: t('markets.closingCountdown', { time: closingIn }) }), _jsxs(Stack, { gap: "xs", children: [_jsxs(Group, { justify: "space-between", children: [_jsx(Text, { fz: "sm", c: "teal.4", children: t('markets.bullishProbability') }), _jsxs(Text, { fw: 700, children: [probability, "%"] })] }), _jsx(Progress, { value: probability, color: "teal", radius: "lg" })] })] }) }, market.id));
}
