import { Card, Text, Stack, Group, Badge, Progress, Button } from '@mantine/core';
import { IconTrendingUp, IconTrendingDown, IconClock } from '@tabler/icons-react';

export interface Market {
  id: string;
  question: string;
  priceFeedId: string;
  currentPrice: number;
  targetPrice: number;
  expiryTime: Date;
  totalPool: number;
  bullishPool: number;
  bearishPool: number;
  userPosition?: 'bullish' | 'bearish';
  userAmount?: number;
}

interface MarketCardProps {
  market: Market;
  onBet: (market: Market) => void;
}

export function MarketCard({ market, onBet }: MarketCardProps) {
  const bullishPercentage = market.totalPool > 0 
    ? (market.bullishPool / market.totalPool) * 100 
    : 50;
  
  const bearishPercentage = 100 - bullishPercentage;
  
  const timeRemaining = market.expiryTime.getTime() - Date.now();
  const hoursRemaining = Math.floor(timeRemaining / (1000 * 60 * 60));
  const minutesRemaining = Math.floor((timeRemaining % (1000 * 60 * 60)) / (1000 * 60));
  
  const isExpired = timeRemaining <= 0;
  const isWinning = market.userPosition === 'bullish' 
    ? market.currentPrice >= market.targetPrice
    : market.currentPrice < market.targetPrice;

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" align="flex-start">
          <Stack gap={4} style={{ flex: 1 }}>
            <Text fw={600} size="md">
              {market.question}
            </Text>
            <Group gap="xs">
              <Badge size="sm" color="gray" variant="light">
                Target: ${market.targetPrice.toLocaleString()}
              </Badge>
              <Badge size="sm" color="blue" variant="light">
                Current: ${market.currentPrice.toLocaleString()}
              </Badge>
            </Group>
          </Stack>
          
          {market.userPosition && (
            <Badge 
              size="lg" 
              color={isWinning ? 'teal' : 'red'}
              variant="filled"
            >
              {market.userPosition === 'bullish' ? '📈' : '📉'} ${market.userAmount}
            </Badge>
          )}
        </Group>

        {/* Time Remaining */}
        <Group gap="xs">
          <IconClock size={16} />
          <Text size="sm" c={isExpired ? 'red' : 'dimmed'}>
            {isExpired 
              ? 'Expired' 
              : `${hoursRemaining}h ${minutesRemaining}m remaining`
            }
          </Text>
        </Group>

        {/* Pool Distribution */}
        <Stack gap={4}>
          <Group justify="space-between">
            <Group gap="xs">
              <IconTrendingUp size={16} color="var(--mantine-color-teal-6)" />
              <Text size="sm" fw={500}>
                Bullish: {bullishPercentage.toFixed(1)}%
              </Text>
            </Group>
            <Group gap="xs">
              <Text size="sm" fw={500}>
                Bearish: {bearishPercentage.toFixed(1)}%
              </Text>
              <IconTrendingDown size={16} color="var(--mantine-color-red-6)" />
            </Group>
          </Group>
          
          <Progress.Root size="lg">
            <Progress.Section value={bullishPercentage} color="teal">
              <Progress.Label>{bullishPercentage.toFixed(0)}%</Progress.Label>
            </Progress.Section>
            <Progress.Section value={bearishPercentage} color="red">
              <Progress.Label>{bearishPercentage.toFixed(0)}%</Progress.Label>
            </Progress.Section>
          </Progress.Root>
        </Stack>

        {/* Total Pool */}
        <Group justify="space-between">
          <Text size="sm" c="dimmed">
            Total Pool
          </Text>
          <Text size="sm" fw={600}>
            ${market.totalPool.toLocaleString()} PYUSD
          </Text>
        </Group>

        {/* Action Button */}
        {!isExpired && (
          <Button 
            fullWidth 
            variant="light" 
            onClick={() => onBet(market)}
          >
            Place Bet
          </Button>
        )}
        
        {isExpired && (
          <Badge size="lg" color="gray" variant="light" fullWidth>
            Market Closed
          </Badge>
        )}
      </Stack>
    </Card>
  );
}
