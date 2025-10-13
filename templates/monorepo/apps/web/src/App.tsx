import { useEffect, useMemo, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import axios from 'axios';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { erc20Abi, formatUnits } from 'viem';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { LAMPORTS_PER_SOL, PublicKey } from '@solana/web3.js';

import { ConnectWallet } from './components/ConnectWallet';
import { ChainSwitcher } from './components/ChainSwitcher';
import { useChain } from './providers/ChainProvider';
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

interface FaucetResponse {
  ok: boolean;
  transactions?: string[];
  error?: string;
}

export function App() {
  const { chain } = useChain();
  const { data, isLoading } = useQuery<AppConfig>({
    queryKey: ['config'],
    queryFn: async () => {
      const { data: config } = await axios.get<AppConfig>('/api/config');
      return config;
    },
  });

  const chainType = chain.chainType;
  const displayChainName = chain.name;
  const displayChainId = chain.chainId;
  const explorerTemplate = chain.blockExplorerAddressTemplate;
  const isLocalChain = chain.key === 'local-hardhat';

  const pyusdFromConfig = chainType === 'solana' ? data?.pyusdMint : data?.pyusdAddress;
  const displayPyusd = chainType === 'solana' ? pyusdFromConfig || chain.pyusdMint : pyusdFromConfig || chain.pyusdAddress;
  const displayRpc = data?.rpcUrl && data.rpcUrl.length > 0 ? data.rpcUrl : chain.rpcUrl;
  const pythEndpoint = data?.pythEndpoint || 'https://hermes.pyth.network';

  const { address, isConnected } = useAccount();
  const { publicKey } = useWallet();
  const { connection } = useConnection();

  const evmChainId = useMemo(() => {
    if (chainType !== 'evm') return undefined;
    if (chain.chainId) return Number(chain.chainId);
    if (data?.targetChain === 'sepolia') return 11155111;
    if (data?.targetChain === 'arbitrum-sepolia') return 421614;
    return undefined;
  }, [chainType, chain.chainId, data?.targetChain]);

  const nativeSymbol = chain.nativeSymbol || (chainType === 'solana' ? 'SOL' : 'ETH');
  const stableSymbol = chain.stableSymbol || 'PYUSD';
  const pyusdDecimals = 6;

  const { data: nativeBalance } = useBalance({
    address,
    chainId: evmChainId,
    query: {
      enabled: chainType === 'evm' && !!address,
    },
  });

  const { data: pyusdBalance } = useReadContract({
    address: chainType === 'evm' && displayPyusd && displayPyusd.startsWith('0x') ? (displayPyusd as `0x${string}`) : undefined,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    chainId: evmChainId,
    query: {
      enabled: chainType === 'evm' && !!address && !!displayPyusd && displayPyusd.startsWith('0x'),
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

        if (displayPyusd) {
          const mintKey = new PublicKey(displayPyusd);
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
  }, [chainType, connection, displayPyusd, publicKey]);

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

  const addressExplorerLink = useMemo(() => {
    if (!explorerTemplate) return undefined;
    if (!address && !publicKey) return undefined;
    const explorerAddress = chainType === 'solana' ? publicKey?.toBase58() : address;
    if (!explorerAddress) return undefined;
    return explorerTemplate.replace('{address}', explorerAddress);
  }, [address, chainType, explorerTemplate, publicKey]);

  const faucetMutation = useMutation({
    mutationFn: async () => {
      if (!address) throw new Error('請先連線 EVM 錢包');
      const { data: response } = await axios.post<FaucetResponse>('/api/faucet', { address });
      if (!response.ok) {
        throw new Error(response.error ?? '請稍後重試');
      }
      return response.transactions ?? [];
    },
  });

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
        <div className="topbar-actions">
          <ChainSwitcher />
          <ConnectWallet chainType={chainType} />
        </div>
      </header>

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
          <dd>{chainType === 'solana' ? 'Solana (Solana Wallet Adapter)' : 'EVM (RainbowKit + WalletConnect)'}</dd>
          <dt>{chainType === 'solana' ? 'PYUSD Mint Address' : 'PYUSD Contract Address'}</dt>
          <dd>{displayPyusd || '未設定'}</dd>
          <dt>{chainType === 'solana' ? 'Solana RPC' : 'EVM RPC'}</dt>
          <dd>{displayRpc || '設定於 .env'}</dd>
          {chainType === 'evm' && (
            <>
              <dt>WalletConnect Project ID</dt>
              <dd>{walletConnectLabel()}</dd>
            </>
          )}
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
        {isLocalChain && chainType === 'evm' && (
          <div className="faucet">
            <button
              type="button"
              className="button"
              disabled={faucetMutation.isPending || !isConnected || !address}
              onClick={() => faucetMutation.mutate()}
            >
              {faucetMutation.isPending ? '發送中...' : '領取本地測試資產'}
            </button>
            {faucetMutation.isSuccess && <p className="status-success">已發送 1 ETH / 100 PYUSD</p>}
            {faucetMutation.isError && (
              <p className="status-error">{(faucetMutation.error as Error).message ?? '請稍後重試'}</p>
            )}
          </div>
        )}
      </section>

      <section className="card">
        <h2>下一步</h2>
        <ol>
          <li>填入 PayPal Sandbox OAuth、PYUSD、Pyth、RPC 設定於 `.env`。</li>
          <li>
            {chainType === 'solana'
              ? '整合 Solana Program / Anchor，串接 PYUSD Mint 與 Pyth Price Feeds。'
              : '使用 Hardhat 部署合約並設定 Pyth Price Feed。'}
          </li>
          <li>部署 API / Worker 至 Railway，前端至 Vercel 或 Railway Static。</li>
        </ol>
      </section>
    </main>
  );

  function walletConnectLabel() {
    return import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '請於 apps/web/.env 設定 VITE_WALLETCONNECT_PROJECT_ID';
  }
}
