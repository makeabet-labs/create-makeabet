import { useMemo, useState } from 'react';
import {
  Alert,
  Badge,
  Button,
  Group,
  Modal,
  NumberInput,
  SegmentedControl,
  Text,
  Title,
  rem,
} from '@mantine/core';

import { SpotlightCard } from './SpotlightCard';
import { LiveMarketList } from './markets/LiveMarketList';
import { HERO_MARKETS } from '../data/markets';
import { useTranslation, useI18n } from '../i18n';

interface SpotlightMarket {
  id: string;
  title: string;
  category: string;
  odds: number;
  closingAt: string;
  participants?: number;
}

interface BettingExperienceProps {
  chainName: string;
  chainSwitcher: React.ReactNode;
  connectWallet: React.ReactNode;
  displayedWallet?: string;
  formattedWallet?: string;
}

type Outcome = 'yes' | 'no';

type BetAmount = number | '';

export function BettingExperience({
  chainName,
  chainSwitcher,
  connectWallet,
  displayedWallet,
  formattedWallet,
}: BettingExperienceProps) {
  const { t } = useTranslation();
  const { locale } = useI18n();

  const [selectedMarket, setSelectedMarket] = useState<SpotlightMarket | null>(null);
  const [selectedOutcome, setSelectedOutcome] = useState<Outcome | null>(null);
  const [betAmount, setBetAmount] = useState<BetAmount>('');
  const [modalOpen, setModalOpen] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusTone, setStatusTone] = useState<'success' | 'error'>('success');

  const heroMarkets = useMemo<SpotlightMarket[]>(() => {
    return HERO_MARKETS.map((market) => ({
      id: market.id,
      title: t(market.titleKey),
      category: t(market.categoryKey),
      odds: market.odds,
      closingAt: market.closingAt,
      participants: market.participants,
    }));
  }, [t, locale]);

  const openBetModal = (market: SpotlightMarket) => {
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

  return (
    <div className="betting-panel">
      <section className="betting-hero">
        <div className="betting-hero__inner">
          <div className="betting-hero__headline">
            <Badge variant="light" color="teal" size="lg" radius="sm" w="fit-content">
              {t('landing.hero.badge')}
            </Badge>
            <Title order={1} ff="inherit">
              {t('landing.hero.title')}
            </Title>
            <Text fz={rem(18)} opacity={0.9}>
              {t('landing.hero.subtitle')}
            </Text>
          </div>
          <div className="betting-hero__actions">
            {chainSwitcher}
            {connectWallet}
          </div>
          <Text fw={600}>{t('scaffold.home.targetNetwork', { network: chainName })}</Text>
        </div>
      </section>

      <section className="betting-spotlight">
        <Group justify="space-between" align="center">
          <Title order={2}>{t('hero.snapshotTitle')}</Title>
          <Text c="dimmed">{t('hero.demoNotification')}</Text>
        </Group>
        <div className="betting-spotlight__grid">
          {heroMarkets.map((market) => (
            <SpotlightCard
              key={market.id}
              market={market}
              onSelect={(id) => {
                const selected = heroMarkets.find((item) => item.id === id);
                if (selected) {
                  openBetModal(selected);
                }
              }}
            />
          ))}
        </div>
      </section>

      <section className="betting-section">
        <LiveMarketList
          title={t('markets.sections.closingSoon')}
          filter="closingSoon"
          onSelect={(market) =>
            openBetModal({
              id: market.id,
              title: market.title,
              category: market.category,
              odds: market.odds,
              closingAt: market.closingAt,
              participants: market.participants,
            })
          }
        />
        <LiveMarketList
          title={t('markets.sections.trending')}
          filter="trending"
          onSelect={(market) =>
            openBetModal({
              id: market.id,
              title: market.title,
              category: market.category,
              odds: market.odds,
              closingAt: market.closingAt,
              participants: market.participants,
            })
          }
        />
      </section>

      <BetModal
        opened={modalOpen}
        onClose={() => setModalOpen(false)}
        market={selectedMarket}
        outcome={selectedOutcome}
        setOutcome={setSelectedOutcome}
        amount={betAmount}
        setAmount={setBetAmount}
        statusMessage={statusMessage}
        statusTone={statusTone}
        onSubmit={handleSubmitBet}
        walletLabel={
          displayedWallet
            ? t('modal.bet.walletConnected', {
                address: formattedWallet ?? displayedWallet,
              })
            : undefined
        }
      />
    </div>
  );
}

interface BetModalProps {
  opened: boolean;
  onClose: () => void;
  market: SpotlightMarket | null;
  outcome: Outcome | null;
  setOutcome: (value: Outcome | null) => void;
  amount: BetAmount;
  setAmount: (value: BetAmount) => void;
  statusMessage: string | null;
  statusTone: 'success' | 'error';
  onSubmit: () => void;
  walletLabel?: string;
}

function BetModal({
  opened,
  onClose,
  market,
  outcome,
  setOutcome,
  amount,
  setAmount,
  statusMessage,
  statusTone,
  onSubmit,
  walletLabel,
}: BetModalProps) {
  const { t } = useTranslation();

  return (
    <Modal opened={opened} onClose={onClose} title={t('modal.bet.title')} centered radius="lg" size="lg">
      <div className="bet-modal__content">
        <Text c="dimmed">{t('modal.bet.subtitle')}</Text>

        {market && (
          <div className="bet-modal__market">
            <Text fw={600}>{market.title}</Text>
            <Group gap="xs" mt="xs">
              <Badge variant="light" color="violet">
                {market.category}
              </Badge>
              <Text size="sm" c="dimmed">
                {t('markets.closingCountdown', {
                  time: new Intl.DateTimeFormat(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  }).format(new Date(market.closingAt)),
                })}
              </Text>
            </Group>
          </div>
        )}

        <div className="bet-modal__selection">
          <div className="bet-modal__selection-control">
            <Text fw={600}>{t('modal.bet.selectionLabel')}</Text>
            <SegmentedControl
              value={outcome ?? undefined}
              onChange={(value) => setOutcome(value as Outcome)}
              data={[
                { label: t('modal.bet.selection.yes'), value: 'yes' },
                { label: t('modal.bet.selection.no'), value: 'no' },
              ]}
            />
          </div>

          <div className="bet-modal__selection-control">
            <Text fw={600}>{t('modal.bet.amountLabel')}</Text>
            <NumberInput
              value={amount}
              onChange={(val) => setAmount(val as BetAmount)}
              min={0.01}
              step={0.5}
              precision={2}
              placeholder="10.00"
              leftSection="PYUSD"
            />
          </div>
        </div>

        {walletLabel && (
          <Alert variant="light" color="blue">
            {walletLabel}
          </Alert>
        )}

        {statusMessage && (
          <Alert
            variant="light"
            color={statusTone === 'success' ? 'green' : 'red'}
            className="bet-modal__status"
          >
            {statusMessage}
          </Alert>
        )}

        <Group justify="space-between">
          <Button variant="default" onClick={onClose}>
            {t('modal.bet.cancel')}
          </Button>
          <Button onClick={onSubmit}>{t('modal.bet.submit')}</Button>
        </Group>
      </div>
    </Modal>
  );
}
