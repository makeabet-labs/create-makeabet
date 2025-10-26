import { useEffect, useState } from 'react';
import { Card, Grid, Text, Stack, Badge, Group, Skeleton, Button } from '@mantine/core';
import { IconTrendingUp, IconTrendingDown, IconMinus, IconPlus } from '@tabler/icons-react';

// Pyth Price Feed IDs (from Hermes Stable)
const PRICE_FEEDS = {
  'BTC/USD': '0xe62df6c8b4a85fe1a67db44dc12de5db330f7ac66b72dc658afedf0f4a415b43',
  'ETH/USD': '0xff61491a931112ddf1bd8147cd1b641375f79f5825126d665480874634fd0ace',
  'SOL/USD': '0xef0d8b6fda2ceba41da15d4095d1da392a0d2f8ed0c6c7bc0f4cfac8c280b56d',
  'USDC/USD': '0xeaa020c61cc479712813461ce153894a96a6c00b21ed0cfc2798d1f9a9e9c94a',
  'USDT/USD': '0x2b89b9dc8fdf9f34709a5b106b472f0f39bb6ca9ce04b0fd7f2e971688e2e53b',
  'BNB/USD': '0x2f95862b045670cd22bee3114c39763a4a08beeb663b145d283c31d7d1101c4f',
};

interface PriceData {
  id: string;
  price: {
    price: string;
    conf: string;
    expo: number;
    publish_time: number;
  };
  ema_price: {
    price: string;
    conf: string;
    expo: number;
    publish_time: number;
  };
}

interface PriceFeedData {
  symbol: string;
  price: number;
  confidence: number;
  change24h?: number;
  lastUpdate: Date;
}

interface PythPriceFeedsProps {
  onCreateMarket?: (symbol: string, currentPrice: number, feedId: string) => void;
}

export function PythPriceFeeds({ onCreateMarket }: PythPriceFeedsProps) {
  const [priceData, setPriceData] = useState<Map<string, PriceFeedData>>(new Map());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPrices = async () => {
      try {
        const hermesUrl = 'https://hermes.pyth.network';
        const feedIds = Object.values(PRICE_FEEDS);
        
        // Build query string with proper encoding
        const queryParams = feedIds.map(id => `ids[]=${id}`).join('&');
        const url = `${hermesUrl}/v2/updates/price/latest?${queryParams}`;
        
        console.log('Fetching prices from:', url);
        
        const response = await fetch(url);

        if (!response.ok) {
          throw new Error(`Failed to fetch price data: ${response.status}`);
        }

        const data = await response.json();
        console.log('Received data:', data);
        
        const newPriceData = new Map<string, PriceFeedData>();

        // Process each price feed
        Object.entries(PRICE_FEEDS).forEach(([symbol, feedId]) => {
          // Remove 0x prefix for comparison
          const feedIdWithout0x = feedId.startsWith('0x') ? feedId.slice(2) : feedId;
          const priceInfo = data.parsed?.find((p: PriceData) => 
            p.id === feedIdWithout0x || p.id === feedId
          );
          
          if (priceInfo) {
            const price = Number(priceInfo.price.price) * Math.pow(10, priceInfo.price.expo);
            const confidence = Number(priceInfo.price.conf) * Math.pow(10, priceInfo.price.expo);
            
            console.log(`${symbol}: $${price.toFixed(2)} ±$${confidence.toFixed(2)}`);
            
            newPriceData.set(symbol, {
              symbol,
              price,
              confidence,
              lastUpdate: new Date(priceInfo.price.publish_time * 1000),
            });
          } else {
            console.warn(`No price data found for ${symbol} (${feedId})`);
          }
        });

        console.log('Updated price data:', newPriceData.size, 'feeds');
        setPriceData(newPriceData);
        setLoading(false);
        setError(null);
      } catch (err) {
        console.error('Error fetching Pyth prices:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch prices');
        setLoading(false);
      }
    };

    // Initial fetch
    fetchPrices();

    // Update every 5 seconds
    const interval = setInterval(fetchPrices, 5000);

    return () => clearInterval(interval);
  }, []);

  const formatPrice = (price: number, symbol: string) => {
    // Format based on price magnitude
    if (price >= 1000) {
      return `$${price.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
    } else if (price >= 1) {
      return `$${price.toFixed(4)}`;
    } else {
      return `$${price.toFixed(6)}`;
    }
  };

  const formatConfidence = (confidence: number) => {
    if (confidence >= 1) {
      return `±$${confidence.toFixed(2)}`;
    } else {
      return `±$${confidence.toFixed(4)}`;
    }
  };

  const getTimeAgo = (date: Date) => {
    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  if (error) {
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text c="red" size="sm">
          Error loading price feeds: {error}
        </Text>
      </Card>
    );
  }

  return (
    <Stack gap="md">
      <Group justify="space-between" align="center">
        <div>
          <Text size="xl" fw={700}>
            Live Price Feeds
          </Text>
          <Text size="sm" c="dimmed">
            Real-time data from Pyth Network
          </Text>
        </div>
        <Badge color="green" variant="dot">
          Live
        </Badge>
      </Group>

      <Grid>
        {Object.keys(PRICE_FEEDS).map((symbol) => {
          const data = priceData.get(symbol);
          const isLoading = loading && !data;

          return (
            <Grid.Col key={symbol} span={{ base: 12, sm: 6, md: 4 }}>
              <Card shadow="sm" padding="lg" radius="md" withBorder>
                <Stack gap="xs">
                  <Group justify="space-between" align="center">
                    <Text fw={600} size="lg">
                      {symbol}
                    </Text>
                    {data && (
                      <Badge size="xs" color="gray" variant="light">
                        {getTimeAgo(data.lastUpdate)}
                      </Badge>
                    )}
                  </Group>

                  {isLoading ? (
                    <>
                      <Skeleton height={32} width="70%" />
                      <Skeleton height={20} width="50%" />
                    </>
                  ) : data ? (
                    <>
                      <Text size="xl" fw={700} c="blue">
                        {formatPrice(data.price, symbol)}
                      </Text>
                      <Text size="xs" c="dimmed">
                        Confidence: {formatConfidence(data.confidence)}
                      </Text>
                      
                      {onCreateMarket && (
                        <Button
                          size="xs"
                          variant="light"
                          leftSection={<IconPlus size={14} />}
                          onClick={() => onCreateMarket(symbol, data.price, PRICE_FEEDS[symbol as keyof typeof PRICE_FEEDS])}
                          fullWidth
                          mt="xs"
                        >
                          Create Market
                        </Button>
                      )}
                    </>
                  ) : (
                    <Text size="sm" c="dimmed">
                      No data available
                    </Text>
                  )}
                </Stack>
              </Card>
            </Grid.Col>
          );
        })}
      </Grid>

      <Text size="xs" c="dimmed" ta="center">
        Price data updates every 5 seconds via Pyth Hermes API
      </Text>
    </Stack>
  );
}
