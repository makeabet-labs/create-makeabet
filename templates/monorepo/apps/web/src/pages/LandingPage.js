import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { Anchor, Badge, Button, Card, Container, Group, SimpleGrid, Stack, Text, Title, ThemeIcon, rem, } from '@mantine/core';
import { IconBolt, IconChartLine, IconShare3 } from '@tabler/icons-react';
import { Link } from '@tanstack/react-router';
import { useEffect } from 'react';
import { useTranslation } from '../i18n';
import './LandingPage.css';
const featureIcons = {
    speed: IconBolt,
    transparency: IconChartLine,
    social: IconShare3,
};
export function LandingPage() {
    const { t } = useTranslation();
    useEffect(() => {
        document.body.classList.add('landing-page-root');
        return () => {
            document.body.classList.remove('landing-page-root');
        };
    }, []);
    const features = [
        {
            key: 'speed',
            title: t('landing.features.speed.title'),
            description: t('landing.features.speed.description'),
        },
        {
            key: 'transparency',
            title: t('landing.features.transparency.title'),
            description: t('landing.features.transparency.description'),
        },
        {
            key: 'social',
            title: t('landing.features.social.title'),
            description: t('landing.features.social.description'),
        },
    ];
    return (_jsxs(Stack, { h: "100vh", justify: "space-between", gap: 0, className: "landing-page", children: [_jsx(Container, { size: "lg", py: "lg", children: _jsxs(Group, { justify: "space-between", align: "center", children: [_jsxs(Group, { gap: "xs", children: [_jsx(Badge, { variant: "filled", size: "lg", radius: "md", children: t('landing.brand') }), _jsx(Text, { c: "dimmed", fz: "sm", children: t('landing.tagline') })] }), _jsx(Group, { gap: "xs", children: _jsx(Button, { variant: "subtle", component: Link, to: "/app", children: t('landing.launch') }) })] }) }), _jsxs(Container, { size: "lg", py: "xl", children: [_jsxs(SimpleGrid, { cols: { base: 1, md: 2 }, spacing: "xl", align: "center", className: "landing-hero-grid", children: [_jsxs(Stack, { gap: "lg", children: [_jsx(Badge, { variant: "light", color: "teal", size: "lg", radius: "sm", w: "fit-content", children: t('landing.hero.badge') }), _jsx(Title, { order: 1, ff: "inherit", children: t('landing.hero.title') }), _jsx(Text, { fz: "lg", c: "dimmed", children: t('landing.hero.subtitle') }), _jsxs(Group, { gap: "md", children: [_jsx(Button, { size: "lg", radius: "md", component: Link, to: "/app", children: t('landing.hero.primaryCta') }), _jsx(Button, { size: "lg", variant: "light", radius: "md", component: Anchor, href: "https://pyth.network", target: "_blank", rel: "noreferrer", children: t('landing.hero.secondaryCta') })] })] }), _jsx("div", { className: "landing-hero-visual", children: _jsxs("div", { className: "landing-hero-banner", children: [_jsx("div", { className: "landing-hero-overlay" }), _jsx("div", { className: "landing-hero-glow landing-hero-glow-one" }), _jsx("div", { className: "landing-hero-glow landing-hero-glow-two" }), _jsx("div", { className: "landing-hero-orbit landing-hero-orbit-one", children: _jsx("span", { className: "landing-hero-node" }) }), _jsx("div", { className: "landing-hero-orbit landing-hero-orbit-two", children: _jsx("span", { className: "landing-hero-node" }) }), _jsxs(Stack, { gap: "sm", className: "landing-hero-text", children: [_jsx(Text, { fw: 700, fz: rem(26), children: t('landing.hero.banner.title') }), _jsx(Text, { c: "dimmed", maw: 380, children: t('landing.hero.banner.description') })] })] }) })] }), _jsxs(Stack, { gap: "lg", mt: 60, children: [_jsx(Title, { order: 3, children: t('landing.features.title') }), _jsx(SimpleGrid, { cols: { base: 1, sm: 3 }, spacing: "md", children: features.map((feature) => {
                                    const Icon = featureIcons[feature.key];
                                    return (_jsx(Card, { radius: "md", withBorder: true, shadow: "sm", p: "lg", children: _jsxs(Stack, { gap: "sm", align: "flex-start", children: [_jsx(ThemeIcon, { size: "xl", radius: "md", variant: "light", color: "teal", children: _jsx(Icon, { size: 24 }) }), _jsx(Text, { fw: 600, children: feature.title }), _jsx(Text, { c: "dimmed", fz: "sm", children: feature.description })] }) }, feature.key));
                                }) })] })] }), _jsx(Container, { size: "lg", py: "md", children: _jsxs(Group, { justify: "space-between", align: "center", children: [_jsx(Text, { fz: "sm", c: "dimmed", children: t('landing.footer.tagline') }), _jsxs(Group, { gap: "md", children: [_jsx(Anchor, { href: "https://docs.pyth.network", target: "_blank", rel: "noreferrer", fz: "sm", children: t('landing.footer.linkPyth') }), _jsx(Anchor, { href: "/docs/pyth-integration.md", target: "_blank", rel: "noreferrer", fz: "sm", children: t('landing.footer.linkDocs') })] })] }) })] }));
}
