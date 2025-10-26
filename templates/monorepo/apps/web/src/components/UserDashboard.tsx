import { Card, Text, Group, Stack, Badge, SimpleGrid } from '@mantine/core';
import { IconTrendingUp, IconTrendingDown, IconCoins, IconChartBar } from '@tabler/icons-react';
import type { Market } from './MarketCard';

interface UserDashboardProps {
  markets: Market[];
}

export function UserDashboard({ markets }: UserDashboardProps) {
  const userMarkets = markets.filter(m => m.userPosition);
  
  const totalBets = userMarkets.length;
  const totalAmount = userMarkets.reduce((sum, m) => sum + (m.userAmount || 0), 0);
  const bullishBets = userMarkets.filter(m => m.userPosition === 'bullish').length;
  const bearishBets = userMarkets.filter(m => m.userPosition === 'bearish').length;
  
  // Calculate potential winnings
  const potentialWinnings = userMarkets.reduce((sum, market) => {
    if (!market.userPosition || !market.userAmount) return sum;
    
    const payout = market.userPosition === 'bullish'
      ? market.userAmount * (market.totalPool / market.bullishPool)
      : market.userAmount * (market.totalPool / market.bearishPool);
    
    return sum + payout;
  }, 0);

  if (totalBets === 0) {
    return null;
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder style={{ background: 'linear-gradient(135deg, rgba(49, 91, 255, 0.05), rgba(20, 220, 200, 0.05))' }}>
      <Stack gap="md">
        <Group justify="space-between" align="center">
          <div>
            <Text size="lg" fw={700}>
              Your Portfolio
            </Text>
            <Text size="sm" c="dimmed">
              Track your active positions
            </Text>
          </div>
          <Badge size="lg" color="blue" variant="filled">
            {totalBets} Active
          </Badge>
        </Group>

        <SimpleGrid cols={{ base: 2, sm: 4 }} spacing="md">
          {/* Total Markets */}
          <Card padding="md" radius="md" withBorder>
            <Stack gap="xs" align="center">
              <IconChartBar size={24} color="var(--mantine-color-blue-6)" />
              <Text size="xs" c="dimmed" ta="center">
                Markets
              </Text>
              <Text size="xl" fw={700}>
                {totalBets}
              </Text>
            </Stack>
          </Card>

          {/* Total Amount */}
          <Card padding="md" radius="md" withBorder>
            <Stack gap="xs" align="center">
              <IconCoins size={24} color="var(--mantine-color-yellow-6)" />
              <Text size="xs" c="dimmed" ta="center">
                Total Bet
              </Text>
              <Text size="xl" fw={700}>
                ${totalAmount.toFixed(0)}
              </Text>
            </Stack>
          </Card>

          {/* Bullish Positions */}
          <Card padding="md" radius="md" withBorder>
            <Stack gap="xs" align="center">
              <IconTrendingUp size={24} color="var(--mantine-color-teal-6)" />
              <Text size="xs" c="dimmed" ta="center">
                Bullish
              </Text>
              <Text size="xl" fw={700} c="teal">
                {bullishBets}
              </Text>
            </Stack>
          </Card>

          {/* Bearish Positions */}
          <Card padding="md" radius="md" withBorder>
            <Stack gap="xs" align="center">
              <IconTrendingDown size={24} color="var(--mantine-color-red-6)" />
              <Text size="xs" c="dimmed" ta="center">
                Bearish
              </Text>
              <Text size="xl" fw={700} c="red">
                {bearishBets}
              </Text>
            </Stack>
          </Card>
        </SimpleGrid>

        {/* Potential Winnings */}
        <Card padding="md" radius="md" style={{ background: 'var(--mantine-color-teal-0)' }}>
          <Group justify="space-between" align="center">
            <div>
              <Text size="sm" c="dimmed">
                Potential Total Payout
              </Text>
              <Text size="xs" c="dimmed">
                If all positions win
              </Text>
            </div>
            <Text size="xl" fw={700} c="teal">
              ${potentialWinnings.toFixed(2)}
            </Text>
          </Group>
        </Card>
      </Stack>
    </Card>
  );
}
