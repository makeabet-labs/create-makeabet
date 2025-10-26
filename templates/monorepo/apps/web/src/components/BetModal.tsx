import { useState } from 'react';
import { Modal, Stack, Text, Group, Button, NumberInput, SegmentedControl, Badge } from '@mantine/core';
import { IconTrendingUp, IconTrendingDown } from '@tabler/icons-react';
import type { Market } from './MarketCard';

interface BetModalProps {
  market: Market | null;
  opened: boolean;
  onClose: () => void;
  onSubmit: (marketId: string, position: 'bullish' | 'bearish', amount: number) => Promise<void>;
  userBalance: number;
}

export function BetModal({ market, opened, onClose, onSubmit, userBalance }: BetModalProps) {
  const [position, setPosition] = useState<'bullish' | 'bearish'>('bullish');
  const [amount, setAmount] = useState<number>(10);
  const [loading, setLoading] = useState(false);

  if (!market) return null;

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await onSubmit(market.id, position, amount);
      onClose();
      // Reset form
      setPosition('bullish');
      setAmount(10);
    } catch (error) {
      console.error('Bet failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const bullishPercentage = market.totalPool > 0 
    ? (market.bullishPool / market.totalPool) * 100 
    : 50;

  const potentialPayout = position === 'bullish'
    ? amount * (market.totalPool / (market.bullishPool + amount))
    : amount * (market.totalPool / (market.bearishPool + amount));

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title="Place Your Bet"
      size="md"
      centered
    >
      <Stack gap="lg">
        {/* Market Info */}
        <Stack gap="xs">
          <Text fw={600} size="lg">
            {market.question}
          </Text>
          <Group gap="xs">
            <Badge color="gray" variant="light">
              Target: ${market.targetPrice.toLocaleString()}
            </Badge>
            <Badge color="blue" variant="light">
              Current: ${market.currentPrice.toLocaleString()}
            </Badge>
          </Group>
        </Stack>

        {/* Current Pool Distribution */}
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Current Pool Distribution
          </Text>
          <Group justify="space-between">
            <Group gap="xs">
              <IconTrendingUp size={16} color="var(--mantine-color-teal-6)" />
              <Text size="sm">
                Bullish: {bullishPercentage.toFixed(1)}%
              </Text>
            </Group>
            <Group gap="xs">
              <Text size="sm">
                Bearish: {(100 - bullishPercentage).toFixed(1)}%
              </Text>
              <IconTrendingDown size={16} color="var(--mantine-color-red-6)" />
            </Group>
          </Group>
        </Stack>

        {/* Position Selection */}
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Your Position
          </Text>
          <SegmentedControl
            value={position}
            onChange={(value) => setPosition(value as 'bullish' | 'bearish')}
            data={[
              {
                label: (
                  <Group gap="xs" justify="center">
                    <IconTrendingUp size={16} />
                    <Text>Bullish</Text>
                  </Group>
                ),
                value: 'bullish',
              },
              {
                label: (
                  <Group gap="xs" justify="center">
                    <IconTrendingDown size={16} />
                    <Text>Bearish</Text>
                  </Group>
                ),
                value: 'bearish',
              },
            ]}
            fullWidth
          />
        </Stack>

        {/* Amount Input */}
        <Stack gap="xs">
          <Text size="sm" fw={500}>
            Bet Amount (PYUSD)
          </Text>
          <NumberInput
            value={amount}
            onChange={(val) => setAmount(Number(val) || 0)}
            min={1}
            max={userBalance}
            step={10}
            placeholder="Enter amount"
            leftSection="$"
          />
          <Text size="xs" c="dimmed">
            Available: ${userBalance.toFixed(2)} PYUSD
          </Text>
        </Stack>

        {/* Potential Payout */}
        <Stack gap="xs">
          <Group justify="space-between">
            <Text size="sm" c="dimmed">
              Potential Payout
            </Text>
            <Text size="lg" fw={700} c="teal">
              ${potentialPayout.toFixed(2)} PYUSD
            </Text>
          </Group>
          <Text size="xs" c="dimmed" ta="center">
            Payout is estimated based on current pool distribution
          </Text>
        </Stack>

        {/* Action Buttons */}
        <Group justify="space-between" mt="md">
          <Button variant="subtle" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            loading={loading}
            disabled={amount <= 0 || amount > userBalance}
            color={position === 'bullish' ? 'teal' : 'red'}
          >
            Place {position === 'bullish' ? 'Bullish' : 'Bearish'} Bet
          </Button>
        </Group>
      </Stack>
    </Modal>
  );
}
