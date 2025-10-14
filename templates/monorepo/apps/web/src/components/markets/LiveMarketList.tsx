import { useMemo } from 'react';
import { Badge, Card, Group, Paper, Progress, SimpleGrid, Stack, Text, Title } from '@mantine/core';
import { IconClockHour4, IconUsersGroup } from '@tabler/icons-react';
import { useI18n, useTranslation } from '../../i18n';
import { formatDistanceToNow } from '../../utils/time';
import { MarketConfig, SECTION_MARKETS } from '../../data/markets';

type SectionKey = keyof typeof SECTION_MARKETS;

type LiveMarketListProps = {
  title: string;
  filter: SectionKey;
  onSelect?: (market: { id: string; title: string; category: string; odds: number; participants: number; closingAt: string }) => void;
};

export function LiveMarketList({ title, filter, onSelect }: LiveMarketListProps) {
  const { t } = useTranslation();
  const { locale } = useI18n();
  const markets = useMemo(() => SECTION_MARKETS[filter] ?? [], [filter]);

  return (
    <Paper radius="lg" p="xl" withBorder>
      <Stack gap="lg">
        <Group justify="space-between" align="center">
          <Title order={3}>{title}</Title>
          <Badge variant="light" color="blue">
            {t('markets.badge.beta')}
          </Badge>
        </Group>
        <SimpleGrid cols={{ base: 1, md: 2 }} spacing="lg">
          {markets.map((market: MarketConfig) => {
            const probability = Math.round(market.odds * 100);
            const titleLabel = t(market.titleKey);
            const categoryLabel = t(market.categoryKey);
            const closingIn = formatDistanceToNow(market.closingAt, locale);
            const participantsCount = market.participants ?? 0;
            const participantsLabel = t('markets.participants', { count: participantsCount });
            const bullishShare = t('markets.bullishShare', { percentage: probability });

            return (
              <Card
                key={market.id}
                padding="lg"
                radius="md"
                withBorder
                onClick={() =>
                  onSelect?.({
                    id: market.id,
                    title: titleLabel,
                    category: categoryLabel,
                    odds: market.odds,
                    participants: market.participants,
                    closingAt: market.closingAt,
                  })
                }
                style={onSelect ? { cursor: 'pointer' } : undefined}
              >
                <Stack gap="sm">
                  <Group justify="space-between">
                    <Text fw={600}>{titleLabel}</Text>
                    <Badge variant="dot">{categoryLabel}</Badge>
                  </Group>
                  <Group gap="xs" c="dimmed" fz="sm">
                    <IconClockHour4 size={16} />
                    <Text>{t('markets.closingIn', { time: closingIn })}</Text>
                  </Group>
                  <Progress value={probability} radius="lg" color="violet" />
                  <Group justify="space-between" align="center">
                    <Group gap="xs" c="teal.4" fz="sm">
                      <IconUsersGroup size={16} />
                      <Text>{participantsLabel}</Text>
                    </Group>
                    <Text fw={700}>{bullishShare}</Text>
                  </Group>
                </Stack>
              </Card>
            );
          })}
        </SimpleGrid>
      </Stack>
    </Paper>
  );
}
