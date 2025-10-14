import { Badge, Card, Group, Progress, Stack, Text } from '@mantine/core';
import { useMemo } from 'react';
import { useI18n, useTranslation } from '../i18n';
import { formatDistanceToNow } from '../utils/time';

type SpotlightCardProps = {
  market: {
    id: string;
    title: string;
    category: string;
    odds: number;
    closingAt: string;
  };
  onSelect?: (marketId: string) => void;
};

export function SpotlightCard({ market, onSelect }: SpotlightCardProps) {
  const { locale } = useI18n();
  const { t } = useTranslation();
  const probability = useMemo(() => Math.round(market.odds * 100), [market.odds]);
  const closingIn = useMemo(() => formatDistanceToNow(market.closingAt, locale), [market.closingAt, locale]);

  return (
    <Card
      withBorder
      radius="md"
      padding="lg"
      key={market.id}
      onClick={() => onSelect?.(market.id)}
      style={onSelect ? { cursor: 'pointer' } : undefined}
    >
      <Stack gap="xs">
        <Group justify="space-between">
          <Text fw={600}>{market.title}</Text>
          <Badge variant="light" color="violet">
            {market.category}
          </Badge>
        </Group>
        <Text c="dimmed" fz="sm">
          {t('markets.closingCountdown', { time: closingIn })}
        </Text>
        <Stack gap="xs">
          <Group justify="space-between">
            <Text fz="sm" c="teal.4">
              {t('markets.bullishProbability')}
            </Text>
            <Text fw={700}>{probability}%</Text>
          </Group>
          <Progress value={probability} color="teal" radius="lg" />
        </Stack>
      </Stack>
    </Card>
  );
}
