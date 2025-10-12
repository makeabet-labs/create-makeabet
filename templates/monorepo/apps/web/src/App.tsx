import { useEffect, useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { erc20Abi, formatUnits } from 'viem';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

import { ConnectWallet } from './components/ConnectWallet';
import type { ChainType } from './providers/WalletProvider';

interface AppConfig {
  paypalClientId: string;
  pythEndpoint: string;
  targetChain: string;
  chainType: ChainType;
  pyusdAddress?: string;
  pyusdMint?: string;
  rpcUrl?: string;
}

const CHAIN_LABELS: Record<string, string> = {
  sepolia: 'Ethereum Sepolia',
  'arbitrum-sepolia': 'Arbitrum Sepolia',
  'solana-devnet': 'Solana Devnet',
};

const CHAIN_ASSETS: Record<
  string,
  {
    native: string;
    stable: string;
  }
> = {
  sepolia: { native: 'ETH', stable: 'PYUSD' },
  'arbitrum-sepolia': { native: 'ETH', stable: 'PYUSD' },
  'solana-devnet': { native: 'SOL', stable: 'PYUSD' },
};

export function App() {
  const { data, isLoading } = useQuery<AppConfig>({
    queryKey: ['config'],
    queryFn: async () => {
      const { data: config } = await axios.get<AppConfig>('/api/config');
      return config;
    },
  });

  const chainType = data?.chainType ?? 'evm';
  const chainName = useMemo(
    () => (data ? CHAIN_LABELS[data.targetChain] ?? data.targetChain : '—'),
    [data]
  );
  const chainAssets = CHAIN_ASSETS[data?.targetChain ?? 'sepolia'] ?? { native: '—', stable: 'PYUSD' };
  const pyusdLabel =
    chainType === 'solana' ? 'PYUSD Mint Address' : 'PYUSD Contract Address';
  const pyusdValue =
    chainType === 'solana'
      ? data?.pyusdMint && data.pyusdMint.length > 0
        ? data.pyusdMint
        : '填入 PYUSD Mint'
      : data?.pyusdAddress && data.pyusdAddress.length > 0
        ? data.pyusdAddress
        : '填入 PYUSD Contract';
  const rpcLabel = chainType === 'solana' ? 'Solana RPC' : 'EVM RPC';
const rpcValue = data?.rpcUrl && data.rpcUrl.length > 0 ? data.rpcUrl : '設定於 .env';
const chainIdValue =
  chainType === 'evm'
    ? import.meta.env.VITE_EVM_CHAIN_ID ||
      (data?.targetChain === 'sepolia'
        ? '11155111'
        : data?.targetChain === 'arbitrum-sepolia'
          ? '421614'
          : '')
    : undefined;

  const { address, isConnected } = useAccount();
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  const evmChainId = useMemo(() => {
    if (chainType !== 'evm') return undefined;
    if (data?.targetChain === 'sepolia') return 11155111;
    if (data?.targetChain === 'arbitrum-sepolia') return 421614;
    return undefined;
  }, [chainType, data?.targetChain]);

  const pyusdDecimals = 6;

  const { data: nativeBalance } = useBalance({
    address,
    chainId: evmChainId,
    query: {
      enabled: chainType === 'evm' && !!address,
    },
  });

  const { data: pyusdBalance } = useReadContract({
    address: chainType === 'evm' && data?.pyusdAddress ? (data.pyusdAddress as `0x${string}`) : undefined,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: evmChainId,
    query: {
      enabled: chainType === 'evm' && !!address && !!data?.pyusdAddress,
    },
  });

  const [solanaNative, setSolanaNative] = useState<string>('尚未連線');
  const [solanaPyusd, setSolanaPyusd] = useState<string>('尚未連線');

  useEffect(() => {
    if (chainType !== 'solana') return;
    if (!publicKey) {
      setSolanaNative('尚未連線');
      setSolanaPyusd('尚未連線');
      return;
    }

    let cancelled = false;

    const fetchBalances = async () => {
      try {
        const lamports = await connection.getBalance(publicKey);
        if (!cancelled) {
          setSolanaNative((lamports / LAMPORTS_PER_SOL).toFixed(4));
        }

        if (data?.pyusdMint) {
          const mintKey = new PublicKey(data.pyusdMint);
          const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, { mint: mintKey });
          const tokenInfo = tokenAccounts.value?.[0]?.account?.data?.parsed?.info?.tokenAmount;
          if (!cancelled) {
            if (tokenInfo) {
              const amount = Number(tokenInfo.amount ?? 0);
              const decimals = tokenInfo.decimals ?? pyusdDecimals;
              const formatted = amount / Math.pow(10, decimals);
              setSolanaPyusd(formatted.toFixed(2));
            } else {
              setSolanaPyusd('0.00');
            }
          }
        } else if (!cancelled) {
          setSolanaPyusd('未設定');
        }
      } catch (error) {
        if (!cancelled) {
          setSolanaNative('錯誤');
          setSolanaPyusd('錯誤');
        }
      }
    };

    fetchBalances();

    return () => {
      cancelled = true;
    };
  }, [chainType, connection, data?.pyusdMint, publicKey]);

  const formattedNativeBalance = useMemo(() => {
    if (chainType === 'solana') return solanaNative;
    if (!isConnected || !address) return '尚未連線';
    if (!nativeBalance) return '載入中';
    return Number(formatUnits(nativeBalance.value, nativeBalance.decimals)).toFixed(4);
  }, [address, chainType, isConnected, nativeBalance, solanaNative]);

  const formattedStableBalance = useMemo(() => {
    if (chainType === 'solana') return solanaPyusd;
    if (!isConnected || !address) return '尚未連線';
    if (!pyusdBalance) return '載入中';
    return Number(formatUnits(pyusdBalance as bigint, pyusdDecimals)).toFixed(2);
  }, [address, chainType, isConnected, pyusdBalance, solanaPyusd]);

  if (isLoading) {
    return <p className="status">載入設定中...</p>;
  }

  return (
    <main className="layout">
      <header className="topbar">
        <div>
          <h1>MakeABet Scaffold</h1>
          <p>PayPal + PYUSD + Pyth 黑客松啟動套件</p>
        </div>
        <ConnectWallet chainType={chainType} />
      </header>

      <section className="card">
        <h2>環境設定</h2>
        <dl>
          <dt>PayPal Client ID</dt>
          <dd>{data?.paypalClientId || '尚未設定'}</dd>
          <dt>Pyth Hermes Endpoint</dt>
          <dd>{data?.pythEndpoint || 'https://hermes.pyth.network'}</dd>
          <dt>目標鏈別</dt>
          <dd>{chainName}</dd>
        </dl>
      </section>

      <section className="card">
        <h2>鏈與錢包設定</h2>
        <dl>
          <dt>鏈類型</dt>
          <dd>{chainType === 'solana' ? 'Solana (Solana Wallet Adapter)' : 'EVM (RainbowKit + WalletConnect)'}</dd>
          {chainIdValue && (
            <>
              <dt>Chain ID</dt>
              <dd>{chainIdValue}</dd>
            </>
          )}
          <dt>{pyusdLabel}</dt>
          <dd>{pyusdValue}</dd>
          <dt>{rpcLabel}</dt>
          <dd>{rpcValue}</dd>
          {chainType === 'evm' && (
            <>
              <dt>WalletConnect Project ID</dt>
              <dd>{import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '請於 apps/web/.env 設定 VITE_WALLETCONNECT_PROJECT_ID'}</dd>
            </>
          )}
        </dl>
      </section>

      <section className="card">
        <h2>資產概覽</h2>
        <dl>
          <dt>Native Asset</dt>
          <dd className="asset-row">
            <span className="asset-symbol">{chainAssets.native}</span>
            <span className="asset-value">{formattedNativeBalance}</span>
          </dd>
          <dt>Stablecoin</dt>
          <dd className="asset-row">
            <span className="asset-symbol">{chainAssets.stable}</span>
            <span className="asset-value">{formattedStableBalance}</span>
          </dd>
        </dl>
      </section>

      <section className="card">
        <h2>下一步</h2>
        <ol>
          <li>填入 PayPal Sandbox OAuth、PYUSD、Pyth、RPC 設定於 `.env`。</li>
          <li>
            {chainType === 'solana'
              ? '整合 Solana Program / Anchor，串接 PYUSD Mint 與 Pyth Price Feeds。'
              : '使用 Hardhat 部署合約與設定 Pyth Price Feed。'}
          </li>
          <li>部署 API / Worker 至 Railway，前端至 Vercel 或 Railway Static。</li>
        </ol>
      </section>
    </main>
  );
}
