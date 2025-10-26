import { useEffect, useMemo, useState } from 'react';
import { Tabs } from '@mantine/core';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { erc20Abi, formatUnits } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { WalletSummary } from './components/WalletSummary';
import { LanguageSwitcher } from './components/LanguageSwitcher';
import { PythPriceFeeds } from './components/PythPriceFeeds';
import { MarketList } from './components/MarketList';

import { useChain } from './providers/ChainProvider';
import type { ChainType } from './providers/WalletProvider';
import { useTranslation } from './i18n';

interface AppConfig {
  paypalClientId: string;
  pythEndpoint: string;
  targetChain: string;
  chainType: ChainType;
  pyusdAddress?: string;
  rpcUrl?: string;
}

interface FaucetResponse {
  ok: boolean;
  transactions?: string[];
  error?: string;
}

type TabValue = 'overview' | 'scaffold';

const TAB_STORAGE_KEY = 'makeabet:app-tab';

export function App() {
  const { t } = useTranslation();

  useEffect(() => {
    document.body.classList.remove('landing-page-root');
  }, []);

  const { chain } = useChain();

  const [createMarketData, setCreateMarketData] = useState<{
    symbol: string;
    currentPrice: number;
    feedId: string;
  } | null>(null);

  const [activeTab, setActiveTab] = useState<TabValue>(() => {
    if (typeof window === 'undefined') {
      return 'overview';
    }
    const stored = window.localStorage.getItem(TAB_STORAGE_KEY) as TabValue | null;
    return stored === 'scaffold' ? 'scaffold' : 'overview';
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(TAB_STORAGE_KEY, activeTab);
    }
  }, [activeTab]);

  const { data, isLoading } = useQuery<AppConfig>({
    queryKey: ['config'],
    queryFn: async () => {
      const { data: config } = await axios.get<AppConfig>('/api/config');
      return config;
    },
  });

  const chainType: ChainType = 'evm';
  const displayChainName = chain.name;
  const displayChainId = chain.chainId;
  const explorerTemplate = chain.blockExplorerAddressTemplate;
  const isLocalChain = chain.key === 'local-hardhat';

  const displayPyusd = data?.pyusdAddress || chain.pyusdAddress;
  const displayRpc = data?.rpcUrl && data.rpcUrl.length > 0 ? data.rpcUrl : chain.rpcUrl;
  const pythEndpoint = data?.pythEndpoint || 'https://hermes.pyth.network';

  const { address, isConnected } = useAccount();

  const evmChainId = useMemo(() => {
    if (chain.chainId) return Number(chain.chainId);
    if (data?.targetChain === 'sepolia') return 11155111;
    if (data?.targetChain === 'arbitrum-sepolia') return 421614;
    return undefined;
  }, [chain.chainId, data?.targetChain]);

  const nativeSymbol = chain.nativeSymbol || 'ETH';
  const stableSymbol = chain.stableSymbol || 'PYUSD';
  const pyusdDecimals = 6;

  const { data: nativeBalance } = useBalance({
    address,
    chainId: evmChainId,
    query: {
      enabled: !!address,
    },
  });

  const { data: pyusdBalance } = useReadContract({
    address:
      displayPyusd && displayPyusd.startsWith('0x')
        ? (displayPyusd as `0x${string}`)
        : undefined,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: evmChainId,
    query: {
      enabled: !!address && !!displayPyusd && displayPyusd.startsWith('0x'),
    },
  });

  const formattedNativeBalance = useMemo(() => {
    if (!isConnected || !address) return 'Not connected';
    if (!nativeBalance) return 'Loading';
    return Number(formatUnits(nativeBalance.value, nativeBalance.decimals)).toFixed(4);
  }, [address, isConnected, nativeBalance]);

  const formattedStableBalance = useMemo(() => {
    if (!isConnected || !address) return 'Not connected';
    if (!pyusdBalance) return 'Loading';
    return Number(formatUnits(pyusdBalance as bigint, pyusdDecimals)).toFixed(2);
  }, [address, isConnected, pyusdBalance]);

  const addressExplorerLink = useMemo(() => {
    if (!explorerTemplate || !address) return undefined;
    return explorerTemplate.replace('{address}', address);
  }, [address, explorerTemplate]);

  const faucetMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error('Please connect your EVM wallet first');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const { data: response } = await axios.post<FaucetResponse>(`${apiUrl}/api/faucet`, { address });
      if (!response.ok) {
        throw new Error(response.error ?? 'Please try again later');
      }
      return response.transactions ?? [];
    },
  });

  const displayedWallet = address ?? undefined;
  const formattedWallet = displayedWallet ? formatAddress(displayedWallet) : undefined;

  if (isLoading) {
    return <p className="status">Loading configuration...</p>;
  }

  return (
    <Tabs
      className="app-tabs"
      value={activeTab}
      onChange={(value) => setActiveTab((value as TabValue) ?? 'overview')}
    >
      <Tabs.List className="app-tabs__list">
        <Tabs.Tab className="app-tabs__tab" value="overview">
          {t('tabs.overview')}
        </Tabs.Tab>
        <Tabs.Tab className="app-tabs__tab" value="scaffold">
          {t('tabs.scaffold')}
        </Tabs.Tab>
      </Tabs.List>

      <Tabs.Panel value="overview" className="app-tabs__panel">
        <div className="dashboard">
          <header className="dashboard-header">
            <div className="dashboard-header__meta">
              <h1>Wallet & Stack Overview</h1>
              <p>Monitor balances, RPC endpoints, and local Hardhat automation.</p>
            </div>
            <div className="dashboard-header__actions">
              <LanguageSwitcher />
              <ConnectButton showBalance={false} />
            </div>
          </header>

          <WalletSummary />

          <section className="card">
            <h2>Environment Configuration</h2>
            <dl>
              <dt>PayPal Client ID</dt>
              <dd>{data?.paypalClientId || 'Not configured'}</dd>
              <dt>Pyth Hermes Endpoint</dt>
              <dd>{pythEndpoint}</dd>
              <dt>Target Chain</dt>
              <dd>{displayChainName}</dd>
              {displayChainId && (
                <>
                  <dt>Chain ID</dt>
                  <dd>{displayChainId}</dd>
                </>
              )}
            </dl>
          </section>

          <section className="card">
            <h2>Chain & Wallet Configuration</h2>
            <dl>
              <dt>Chain Type</dt>
              <dd>EVM (RainbowKit + WalletConnect)</dd>
              <dt>PYUSD Contract Address</dt>
              <dd>{displayPyusd || 'Not configured'}</dd>
              <dt>EVM RPC</dt>
              <dd>{displayRpc || 'Configured in .env'}</dd>
              <dt>WalletConnect Project ID</dt>
              <dd>{walletConnectLabel()}</dd>
              {addressExplorerLink && (
                <>
                  <dt>Explorer</dt>
                  <dd>
                    <a href={addressExplorerLink} target="_blank" rel="noreferrer" className="link">
                      View Address
                    </a>
                  </dd>
                </>
              )}
            </dl>
          </section>

          <section className="card">
            <h2>Asset Overview</h2>
            <dl>
              <dt>Native Asset</dt>
              <dd className="asset-row">
                <span className="asset-symbol">{nativeSymbol}</span>
                <span className="asset-value">{formattedNativeBalance}</span>
              </dd>
              <dt>Stablecoin</dt>
              <dd className="asset-row">
                <span className="asset-symbol">{stableSymbol}</span>
                <span className="asset-value">{formattedStableBalance}</span>
              </dd>
            </dl>
          </section>

          <section className="card">
            <h2>Testnet Faucets</h2>
            <p style={{ marginBottom: '1rem', color: '#64748b' }}>
              Get test PYUSD tokens for Sepolia testnet
            </p>
            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <a
                href="https://faucet.paxos.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="button"
                style={{ textDecoration: 'none' }}
              >
                🚰 Paxos PYUSD Faucet
              </a>
              <a
                href="https://cloud.google.com/application/web3/faucet/ethereum/sepolia/pyusd"
                target="_blank"
                rel="noopener noreferrer"
                className="button"
                style={{ textDecoration: 'none' }}
              >
                🌐 Google Cloud PYUSD Faucet
              </a>
            </div>
            <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#64748b' }}>
              💡 Note: These faucets provide PYUSD on Sepolia testnet. Make sure your wallet is connected to Sepolia network.
            </p>
          </section>

          <section className="card">
            <h2>Next Steps</h2>
            <ol>
              <li>Configure PayPal Sandbox OAuth, PYUSD, Pyth, and RPC settings in `.env`.</li>
              <li>Deploy contracts with Hardhat and configure Pyth Price Feed.</li>
              <li>Deploy API / Worker to Railway, and frontend to Vercel or Railway Static.</li>
            </ol>
          </section>
        </div>
      </Tabs.Panel>

      <Tabs.Panel value="scaffold" className="app-tabs__panel">
        <div className="dashboard">
          <header className="dashboard-header">
            <div className="dashboard-header__meta">
              <h1>MakeABet App</h1>
              <p>Decentralized prediction markets powered by Pyth Network</p>
            </div>
            <div className="dashboard-header__actions">
              <LanguageSwitcher />
              <ConnectButton showBalance={false} />
            </div>
          </header>

          {/* Price Feeds Section */}
          <PythPriceFeeds 
            onCreateMarket={(symbol, currentPrice, feedId) => {
              setCreateMarketData({ symbol, currentPrice, feedId });
            }}
          />
          
          {/* Markets Section */}
          <MarketList 
            userBalance={Number(formattedStableBalance.replace(/[^0-9.-]+/g,"")) || 0}
            createMarketData={createMarketData}
            onCreateMarketComplete={() => setCreateMarketData(null)}
          />
        </div>
      </Tabs.Panel>
    </Tabs>
  );

  function walletConnectLabel() {
    return (
      import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ||
      'Set VITE_WALLETCONNECT_PROJECT_ID in apps/web/.env'
    );
  }
}

function formatAddress(value: string) {
  if (value.length <= 12) {
    return value;
  }
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
