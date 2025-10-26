import { useState, useEffect } from 'react';
import { Stack, Text, Grid, Group, Badge, Button } from '@mantine/core';
import { IconPlus, IconRefresh } from '@tabler/icons-react';
import { MarketCard, type Market } from './MarketCard';
import { BetModal } from './BetModal';
import { UserDashboard } from './UserDashboard';
import { CreateMarketModal } from './CreateMarketModal';
import { useMarketContract } from '../hooks/useMarketContract';
import { useAccount } from 'wagmi';

// Mock data for demonstration
const MOCK_MARKETS: Market[] = [
  {
    id: '1',
    question: 'Will BTC reach $120,000 by end of week?',
    priceFeedId: 'btc-usd',
    currentPrice: 113704,
    targetPrice: 120000,
    expiryTime: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days
    totalPool: 15420,
    bullishPool: 8230,
    bearishPool: 7190,
  },
  {
    id: '2',
    question: 'Will ETH stay above $4,000 for next 24h?',
    priceFeedId: 'eth-usd',
    currentPrice: 4080,
    targetPrice: 4000,
    expiryTime: new Date(Date.now() + 24 * 60 * 60 * 1000), // 1 day
    totalPool: 8950,
    bullishPool: 6200,
    bearishPool: 2750,
    userPosition: 'bullish',
    userAmount: 50,
  },
  {
    id: '3',
    question: 'Will SOL break $200 this week?',
    priceFeedId: 'sol-usd',
    currentPrice: 198.90,
    targetPrice: 200,
    expiryTime: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
    totalPool: 5670,
    bullishPool: 3890,
    bearishPool: 1780,
  },
  {
    id: '4',
    question: 'Will USDC maintain $1.00 peg?',
    priceFeedId: 'usdc-usd',
    currentPrice: 0.9999,
    targetPrice: 1.0,
    expiryTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
    totalPool: 2340,
    bullishPool: 1890,
    bearishPool: 450,
  },
  {
    id: '5',
    question: 'Will BNB reach $700 by month end?',
    priceFeedId: 'bnb-usd',
    currentPrice: 1135.44,
    targetPrice: 700,
    expiryTime: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 days
    totalPool: 12800,
    bullishPool: 2100,
    bearishPool: 10700,
    userPosition: 'bearish',
    userAmount: 25,
  },
];

interface MarketListProps {
  userBalance: number;
  createMarketData?: {
    symbol: string;
    currentPrice: number;
    feedId: string;
  } | null;
  onCreateMarketComplete?: () => void;
}

export function MarketList({ 
  userBalance, 
  createMarketData,
  onCreateMarketComplete 
}: MarketListProps) {
  const [markets, setMarkets] = useState<Market[]>(MOCK_MARKETS);
  const [selectedMarket, setSelectedMarket] = useState<Market | null>(null);
  const [betModalOpened, setBetModalOpened] = useState(false);
  const [createMarketOpened, setCreateMarketOpened] = useState(false);
  const [useRealContract, setUseRealContract] = useState(false);

  const { address, isConnected } = useAccount();
  
  // Get contract addresses - use deployed addresses for local development
  const marketAddress = import.meta.env.VITE_MARKET_CONTRACT_ADDRESS || '0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512';
  const pyusdAddress = import.meta.env.VITE_PYUSD_CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3';
  
  const { placeBet: placeBetContract, createMarket: createMarketContract } = useMarketContract(
    marketAddress,
    pyusdAddress
  );

  // Check if we should use real contract (if addresses are available and user is connected)
  useEffect(() => {
    const shouldUseReal = !!marketAddress && !!pyusdAddress && isConnected;
    console.log('Contract mode check:', {
      marketAddress,
      pyusdAddress,
      isConnected,
      shouldUseReal
    });
    setUseRealContract(shouldUseReal);
  }, [marketAddress, pyusdAddress, isConnected]);

  // Open create market modal when data is provided
  useEffect(() => {
    if (createMarketData) {
      setCreateMarketOpened(true);
    }
  }, [createMarketData]);

  const handleBet = (market: Market) => {
    setSelectedMarket(market);
    setBetModalOpened(true);
  };

  const handleSubmitBet = async (
    marketId: string, 
    position: 'bullish' | 'bearish', 
    amount: number
  ) => {
    console.log('Placing bet:', { marketId, position, amount, useRealContract });
    
    if (useRealContract) {
      try {
        // Real contract call
        const isBullish = position === 'bullish';
        const tx = await placeBetContract(Number(marketId), isBullish, amount);
        console.log('Bet transaction:', tx);
        
        // Wait for transaction to be mined
        // In a real app, you'd use useWaitForTransactionReceipt
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Update local state after successful transaction
        setMarkets(prev => prev.map(market => {
          if (market.id === marketId) {
            return {
              ...market,
              userPosition: position,
              userAmount: amount,
              totalPool: market.totalPool + amount,
              bullishPool: position === 'bullish' 
                ? market.bullishPool + amount 
                : market.bullishPool,
              bearishPool: position === 'bearish' 
                ? market.bearishPool + amount 
                : market.bearishPool,
            };
          }
          return market;
        }));
      } catch (error) {
        console.error('Failed to place bet:', error);
        throw error;
      }
    } else {
      // Mock bet submission
      setMarkets(prev => prev.map(market => {
        if (market.id === marketId) {
          return {
            ...market,
            userPosition: position,
            userAmount: amount,
            totalPool: market.totalPool + amount,
            bullishPool: position === 'bullish' 
              ? market.bullishPool + amount 
              : market.bullishPool,
            bearishPool: position === 'bearish' 
              ? market.bearishPool + amount 
              : market.bearishPool,
          };
        }
        return market;
      }));
      
      // Simulate transaction delay
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
  };

  const handleCreateMarket = async (marketData: {
    symbol: string;
    currentPrice: number;
    targetPrice: number;
    expiryTime: Date;
    question: string;
    feedId: string;
  }) => {
    console.log('Creating market:', { marketData, useRealContract });
    
    if (useRealContract) {
      try {
        // Real contract call
        const expiryTimestamp = Math.floor(marketData.expiryTime.getTime() / 1000);
        const tx = await createMarketContract(
          marketData.question,
          marketData.feedId,
          marketData.targetPrice,
          expiryTimestamp
        );
        console.log('Create market transaction:', tx);
        
        // Wait for transaction
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Create new market in local state
        const newMarket: Market = {
          id: `${Date.now()}`,
          question: marketData.question,
          priceFeedId: marketData.feedId,
          currentPrice: marketData.currentPrice,
          targetPrice: marketData.targetPrice,
          expiryTime: marketData.expiryTime,
          totalPool: 0,
          bullishPool: 0,
          bearishPool: 0,
        };

        setMarkets(prev => [newMarket, ...prev]);
      } catch (error) {
        console.error('Failed to create market:', error);
        throw error;
      }
    } else {
      // Mock market creation
      const newMarket: Market = {
        id: `${Date.now()}`,
        question: marketData.question,
        priceFeedId: marketData.feedId,
        currentPrice: marketData.currentPrice,
        targetPrice: marketData.targetPrice,
        expiryTime: marketData.expiryTime,
        totalPool: 0,
        bullishPool: 0,
        bearishPool: 0,
      };

      setMarkets(prev => [newMarket, ...prev]);
    }
    
    // Close modal and notify parent
    setCreateMarketOpened(false);
    if (onCreateMarketComplete) {
      onCreateMarketComplete();
    }
  };

  const activeMarkets = markets.filter(m => m.expiryTime.getTime() > Date.now());
  const expiredMarkets = markets.filter(m => m.expiryTime.getTime() <= Date.now());
  const userMarkets = markets.filter(m => m.userPosition);

  return (
    <Stack gap="xl">
      {/* Header */}
      <Group justify="space-between" align="center">
        <div>
          <Text size="xl" fw={700}>
            Prediction Markets
          </Text>
          <Group gap="xs" align="center">
            <Text size="sm" c="dimmed">
              Bet on cryptocurrency price movements using Pyth Network data
            </Text>
            {useRealContract && (
              <Badge size="sm" color="green" variant="dot">
                Live Contract
              </Badge>
            )}
            {!useRealContract && (
              <Badge size="sm" color="gray" variant="dot">
                Demo Mode
              </Badge>
            )}
          </Group>
        </div>
        <Group>
          <Button
            size="xs"
            variant={useRealContract ? "filled" : "light"}
            color={useRealContract ? "green" : "gray"}
            onClick={() => {
              const newMode = !useRealContract;
              // Only allow switching to Live mode if contracts are available
              if (newMode && (!marketAddress || !pyusdAddress || !isConnected)) {
                console.warn('Cannot switch to Live mode: contracts not available or wallet not connected');
                return;
              }
              setUseRealContract(newMode);
              console.log('Switched to:', newMode ? 'Live Contract' : 'Demo Mode');
            }}
          >
            {useRealContract ? '🔗 Live' : '🎮 Demo'}
          </Button>
          <Button
            size="xs"
            variant="light"
            leftSection={<IconRefresh size={16} />}
            onClick={() => {
              // Refresh markets - in real implementation, fetch from API
              console.log('Refreshing markets...');
            }}
          >
            Refresh
          </Button>
        </Group>
      </Group>

      {/* User Dashboard */}
      <UserDashboard markets={markets} />

      {/* User's Active Bets */}
      {userMarkets.length > 0 && (
        <Stack gap="md">
          <Group justify="space-between">
            <Text size="lg" fw={600}>
              Your Active Bets
            </Text>
            <Badge color="blue" variant="light">
              {userMarkets.length} position{userMarkets.length !== 1 ? 's' : ''}
            </Badge>
          </Group>
          <Grid>
            {userMarkets.map((market) => (
              <Grid.Col key={market.id} span={{ base: 12, md: 6, lg: 4 }}>
                <MarketCard market={market} onBet={handleBet} />
              </Grid.Col>
            ))}
          </Grid>
        </Stack>
      )}

      {/* Active Markets */}
      <Stack gap="md">
        <Group justify="space-between">
          <Text size="lg" fw={600}>
            Active Markets
          </Text>
          <Badge color="green" variant="light">
            {activeMarkets.length} live
          </Badge>
        </Group>
        <Grid>
          {activeMarkets.map((market) => (
            <Grid.Col key={market.id} span={{ base: 12, md: 6, lg: 4 }}>
              <MarketCard market={market} onBet={handleBet} />
            </Grid.Col>
          ))}
        </Grid>
      </Stack>

      {/* Expired Markets */}
      {expiredMarkets.length > 0 && (
        <Stack gap="md">
          <Group justify="space-between">
            <Text size="lg" fw={600}>
              Recently Closed
            </Text>
            <Badge color="gray" variant="light">
              {expiredMarkets.length} closed
            </Badge>
          </Group>
          <Grid>
            {expiredMarkets.map((market) => (
              <Grid.Col key={market.id} span={{ base: 12, md: 6, lg: 4 }}>
                <MarketCard market={market} onBet={handleBet} />
              </Grid.Col>
            ))}
          </Grid>
        </Stack>
      )}

      {/* Bet Modal */}
      <BetModal
        market={selectedMarket}
        opened={betModalOpened}
        onClose={() => setBetModalOpened(false)}
        onSubmit={handleSubmitBet}
        userBalance={userBalance}
      />

      {/* Create Market Modal */}
      <CreateMarketModal
        opened={createMarketOpened}
        onClose={() => {
          setCreateMarketOpened(false);
          if (onCreateMarketComplete) {
            onCreateMarketComplete();
          }
        }}
        onSubmit={handleCreateMarket}
        symbol={createMarketData?.symbol}
        currentPrice={createMarketData?.currentPrice}
        feedId={createMarketData?.feedId}
      />
    </Stack>
  );
}

// Export the handler for use in parent components
export type { Market };
export { type MarketListProps };
