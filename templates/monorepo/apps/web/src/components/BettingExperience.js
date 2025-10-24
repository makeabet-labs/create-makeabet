import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useState } from 'react';
import { Alert, Badge, Button, Group, Modal, NumberInput, SegmentedControl, Text, Title, rem, } from '@mantine/core';
import { SpotlightCard } from './SpotlightCard';
import { LiveMarketList } from './markets/LiveMarketList';
import { HERO_MARKETS } from '../data/markets';
import { useTranslation, useI18n } from '../i18n';
export function BettingExperience({ chainName, chainSwitcher, connectWallet, displayedWallet, formattedWallet, }) {
    const { t } = useTranslation();
    const { locale } = useI18n();
    const [selectedMarket, setSelectedMarket] = useState(null);
    const [selectedOutcome, setSelectedOutcome] = useState(null);
    const [betAmount, setBetAmount] = useState('');
    const [modalOpen, setModalOpen] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null);
    const [statusTone, setStatusTone] = useState('success');
    const heroMarkets = useMemo(() => {
        return HERO_MARKETS.map((market) => ({
            id: market.id,
            title: t(market.titleKey),
            category: t(market.categoryKey),
            odds: market.odds,
            closingAt: market.closingAt,
            participants: market.participants,
        }));
    }, [t, locale]);
    const openBetModal = (market) => {
        setSelectedMarket(market);
        setSelectedOutcome(null);
        setBetAmount('');
        setStatusMessage(null);
        setModalOpen(true);
    };
    const handleSubmitBet = () => {
        if (!selectedOutcome || betAmount === '' || betAmount <= 0) {
            setStatusTone('error');
            setStatusMessage(t('modal.bet.required'));
            return;
        }
        if (!displayedWallet) {
            setStatusTone('error');
            setStatusMessage(t('wallet.connectPrompt'));
            return;
        }
        setStatusTone('success');
        setStatusMessage(t('modal.bet.success'));
    };
    return (_jsxs("div", { className: "betting-panel", children: [_jsx("section", { className: "betting-hero", children: _jsxs("div", { className: "betting-hero__inner", children: [_jsxs("div", { className: "betting-hero__headline", children: [_jsx(Badge, { variant: "light", color: "teal", size: "lg", radius: "sm", w: "fit-content", children: t('landing.hero.badge') }), _jsx(Title, { order: 1, ff: "inherit", children: t('landing.hero.title') }), _jsx(Text, { fz: rem(18), opacity: 0.9, children: t('landing.hero.subtitle') })] }), _jsxs("div", { className: "betting-hero__actions", children: [chainSwitcher, connectWallet] }), _jsx(Text, { fw: 600, children: t('scaffold.home.targetNetwork', { network: chainName }) })] }) }), _jsxs("section", { className: "betting-spotlight", children: [_jsxs(Group, { justify: "space-between", align: "center", children: [_jsx(Title, { order: 2, children: t('hero.snapshotTitle') }), _jsx(Text, { c: "dimmed", children: t('hero.demoNotification') })] }), _jsx("div", { className: "betting-spotlight__grid", children: heroMarkets.map((market) => (_jsx(SpotlightCard, { market: market, onSelect: (id) => {
                                const selected = heroMarkets.find((item) => item.id === id);
                                if (selected) {
                                    openBetModal(selected);
                                }
                            } }, market.id))) })] }), _jsxs("section", { className: "betting-section", children: [_jsx(LiveMarketList, { title: t('markets.sections.closingSoon'), filter: "closingSoon", onSelect: (market) => openBetModal({
                            id: market.id,
                            title: market.title,
                            category: market.category,
                            odds: market.odds,
                            closingAt: market.closingAt,
                            participants: market.participants,
                        }) }), _jsx(LiveMarketList, { title: t('markets.sections.trending'), filter: "trending", onSelect: (market) => openBetModal({
                            id: market.id,
                            title: market.title,
                            category: market.category,
                            odds: market.odds,
                            closingAt: market.closingAt,
                            participants: market.participants,
                        }) })] }), _jsx(BetModal, { opened: modalOpen, onClose: () => setModalOpen(false), market: selectedMarket, outcome: selectedOutcome, setOutcome: setSelectedOutcome, amount: betAmount, setAmount: setBetAmount, statusMessage: statusMessage, statusTone: statusTone, onSubmit: handleSubmitBet, walletLabel: displayedWallet
                    ? t('modal.bet.walletConnected', {
                        address: formattedWallet ?? displayedWallet,
                    })
                    : undefined })] }));
}
function BetModal({ opened, onClose, market, outcome, setOutcome, amount, setAmount, statusMessage, statusTone, onSubmit, walletLabel, }) {
    const { t } = useTranslation();
    return (_jsx(Modal, { opened: opened, onClose: onClose, title: t('modal.bet.title'), centered: true, radius: "lg", size: "lg", children: _jsxs("div", { className: "bet-modal__content", children: [_jsx(Text, { c: "dimmed", children: t('modal.bet.subtitle') }), market && (_jsxs("div", { className: "bet-modal__market", children: [_jsx(Text, { fw: 600, children: market.title }), _jsxs(Group, { gap: "xs", mt: "xs", children: [_jsx(Badge, { variant: "light", color: "violet", children: market.category }), _jsx(Text, { size: "sm", c: "dimmed", children: t('markets.closingCountdown', {
                                        time: new Intl.DateTimeFormat(undefined, {
                                            month: 'short',
                                            day: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        }).format(new Date(market.closingAt)),
                                    }) })] })] })), _jsxs("div", { className: "bet-modal__selection", children: [_jsxs("div", { className: "bet-modal__selection-control", children: [_jsx(Text, { fw: 600, children: t('modal.bet.selectionLabel') }), _jsx(SegmentedControl, { value: outcome ?? undefined, onChange: (value) => setOutcome(value), data: [
                                        { label: t('modal.bet.selection.yes'), value: 'yes' },
                                        { label: t('modal.bet.selection.no'), value: 'no' },
                                    ] })] }), _jsxs("div", { className: "bet-modal__selection-control", children: [_jsx(Text, { fw: 600, children: t('modal.bet.amountLabel') }), _jsx(NumberInput, { value: amount, onChange: (val) => setAmount(val), min: 0.01, step: 0.5, precision: 2, placeholder: "10.00", leftSection: "PYUSD" })] })] }), walletLabel && (_jsx(Alert, { variant: "light", color: "blue", children: walletLabel })), statusMessage && (_jsx(Alert, { variant: "light", color: statusTone === 'success' ? 'green' : 'red', className: "bet-modal__status", children: statusMessage })), _jsxs(Group, { justify: "space-between", children: [_jsx(Button, { variant: "default", onClick: onClose, children: t('modal.bet.cancel') }), _jsx(Button, { onClick: onSubmit, children: t('modal.bet.submit') })] })] }) }));
}
