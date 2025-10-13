import { ReactNode } from 'react';
import '@rainbow-me/rainbowkit/styles.css';
import '@solana/wallet-adapter-react-ui/styles.css';
import { RainbowKitProvider, getDefaultConfig } from '@rainbow-me/rainbowkit';
import { ConnectionProvider, WalletProvider as SolanaWalletProvider } from '@solana/wallet-adapter-react';
import { WalletModalProvider } from '@solana/wallet-adapter-react-ui';
import { PhantomWalletAdapter } from '@solana/wallet-adapter-phantom';
import { SolflareWalletAdapter } from '@solana/wallet-adapter-solflare';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { injected } from 'wagmi/connectors';
import { arbitrumSepolia, sepolia } from 'wagmi/chains';

import { useChain } from './ChainProvider';

export type ChainType = 'evm' | 'solana';

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const { chain } = useChain();
  const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

  if (chain.chainType === 'solana') {
    const endpoint = import.meta.env.VITE_SOLANA_RPC_URL || chain.rpcUrl || 'https://api.devnet.solana.com';

    return (
      <ConnectionProvider endpoint={endpoint}>
        <SolanaWalletProvider wallets={[new PhantomWalletAdapter(), new SolflareWalletAdapter()]} autoConnect>
          <WalletModalProvider>{children}</WalletModalProvider>
        </SolanaWalletProvider>
      </ConnectionProvider>
    );
  }

  const selectedChain =
    chain.key === 'arbitrum-sepolia'
      ? arbitrumSepolia
      : chain.key === 'local-hardhat'
        ? {
            ...sepolia,
            id: Number(chain.chainId ?? 31337),
            name: 'Hardhat (Local)',
            rpcUrls: {
              default: { http: [chain.rpcUrl ?? 'http://127.0.0.1:8545'] },
              public: { http: [chain.rpcUrl ?? 'http://127.0.0.1:8545'] },
            },
          }
        : sepolia;

  const rpcUrl = import.meta.env.VITE_EVM_RPC_URL || chain.rpcUrl || selectedChain.rpcUrls.public?.http?.[0] || '';

  const wagmiConfig = projectId
    ? getDefaultConfig({
        appName: 'MakeABet Scaffold',
        projectId,
        chains: [selectedChain],
        transports: {
          [selectedChain.id]: http(rpcUrl),
        },
        ssr: false,
      })
    : createConfig({
        chains: [selectedChain],
        connectors: [injected({ target: 'all' })],
        transports: {
          [selectedChain.id]: http(rpcUrl),
        },
        ssr: false,
      });

  return (
    <WagmiProvider config={wagmiConfig}>
      <RainbowKitProvider modalSize="compact">{children}</RainbowKitProvider>
    </WagmiProvider>
  );
};
