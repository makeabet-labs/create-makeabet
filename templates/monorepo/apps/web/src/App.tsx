import { useEffect, useMemo, useState, lazy, Suspense } from 'react';
import { Tabs } from '@mantine/core';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { erc20Abi, formatUnits } from 'viem';
import { ConnectButton } from '@rainbow-me/rainbowkit';
import { ChainSwitcher } from './components/ChainSwitcher';
import { WalletSummary } from './components/WalletSummary';

// Lazy load heavy components
const BettingExperience = lazy(() =>
  import('./components/BettingExperience').then((module) => ({
    default: module.BettingExperience,
  }))
);

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
    if (!isConnected || !address) return '尚未連線';
    if (!nativeBalance) return '載入中';
    return Number(formatUnits(nativeBalance.value, nativeBalance.decimals)).toFixed(4);
  }, [address, isConnected, nativeBalance]);

  const formattedStableBalance = useMemo(() => {
    if (!isConnected || !address) return '尚未連線';
    if (!pyusdBalance) return '載入中';
    return Number(formatUnits(pyusdBalance as bigint, pyusdDecimals)).toFixed(2);
  }, [address, isConnected, pyusdBalance]);

  const addressExplorerLink = useMemo(() => {
    if (!explorerTemplate || !address) return undefined;
    return explorerTemplate.replace('{address}', address);
  }, [address, explorerTemplate]);

  const faucetMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error('請先連線 EVM 錢包');
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
      const { data: response } = await axios.post<FaucetResponse>(`${apiUrl}/api/faucet`, { address });
      if (!response.ok) {
        throw new Error(response.error ?? '請稍後重試');
      }
      return response.transactions ?? [];
    },
  });

  const displayedWallet = address ?? undefined;
  const formattedWallet = displayedWallet ? formatAddress(displayedWallet) : undefined;

  if (isLoading) {
    return <p className="status">載入設定中...</p>;
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
              <ChainSwitcher />
              <ConnectButton chainStatus="icon" showBalance={false} />
            </div>
          </header>

          <WalletSummary />

          <section className="card">
            <h2>環境設定</h2>
            <dl>
              <dt>PayPal Client ID</dt>
              <dd>{data?.paypalClientId || '尚未設定'}</dd>
              <dt>Pyth Hermes Endpoint</dt>
              <dd>{pythEndpoint}</dd>
              <dt>目標鏈別</dt>
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
            <h2>鏈與錢包設定</h2>
            <dl>
              <dt>鏈類型</dt>
              <dd>EVM (RainbowKit + WalletConnect)</dd>
              <dt>PYUSD Contract Address</dt>
              <dd>{displayPyusd || '未設定'}</dd>
              <dt>EVM RPC</dt>
              <dd>{displayRpc || '設定於 .env'}</dd>
              <dt>WalletConnect Project ID</dt>
              <dd>{walletConnectLabel()}</dd>
              {addressExplorerLink && (
                <>
                  <dt>Explorer</dt>
                  <dd>
                    <a href={addressExplorerLink} target="_blank" rel="noreferrer" className="link">
                      查看地址
                    </a>
                  </dd>
                </>
              )}
            </dl>
          </section>

          <section className="card">
            <h2>資產概覽</h2>
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
            {isLocalChain && (
              <div className="faucet">
                <button
                  type="button"
                  className="button"
                  disabled={faucetMutation.isPending || !isConnected || !address}
                  onClick={() => faucetMutation.mutate()}
                >
                  {faucetMutation.isPending ? '發送中...' : '領取本地測試資產'}
                </button>
                {faucetMutation.isSuccess && (
                  <p className="status-success">
                    已發送 1 ETH / 100 PYUSD
                    {faucetMutation.data?.length ? ` (tx: ${faucetMutation.data[0]})` : ''}
                  </p>
                )}
                {faucetMutation.isError && (
                  <p className="status-error">
                    {(faucetMutation.error as Error).message ?? '請稍後重試'}
                  </p>
                )}
              </div>
            )}
          </section>

          <section className="card">
            <h2>下一步</h2>
            <ol>
              <li>填入 PayPal Sandbox OAuth、PYUSD、Pyth、RPC 設定於 `.env`。</li>
              <li>使用 Hardhat 部署合約並設定 Pyth Price Feed。</li>
              <li>部署 API / Worker 至 Railway，前端至 Vercel 或 Railway Static。</li>
            </ol>
          </section>
        </div>
      </Tabs.Panel>

      <Tabs.Panel value="scaffold" className="app-tabs__panel">
        <Suspense fallback={<div className="loading-fallback">載入中...</div>}>
          <BettingExperience
            chainName={chain.name}
            chainSwitcher={<ChainSwitcher />}
            connectWallet={<ConnectButton chainStatus="icon" showBalance={false} />}
            displayedWallet={displayedWallet}
            formattedWallet={formattedWallet}
          />
        </Suspense>
      </Tabs.Panel>
    </Tabs>
  );

  function walletConnectLabel() {
    return (
      import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ||
      '請於 apps/web/.env 設定 VITE_WALLETCONNECT_PROJECT_ID'
    );
  }
}

function formatAddress(value: string) {
  if (value.length <= 12) {
    return value;
  }
  return `${value.slice(0, 6)}...${value.slice(-4)}`;
}
