import { ReactNode, useMemo } from 'react';
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

type ChainType = 'evm' | 'solana';
type TargetChain = 'sepolia' | 'arbitrum-sepolia' | 'solana-devnet';

interface WalletProviderProps {
  children: ReactNode;
}

export const WalletProvider = ({ children }: WalletProviderProps) => {
  const chainType = (import.meta.env.VITE_CHAIN_TYPE as ChainType) ?? 'evm';
  const targetChain = (import.meta.env.VITE_TARGET_CHAIN as TargetChain) ?? 'sepolia';
  const selectedChain = targetChain === 'arbitrum-sepolia' ? arbitrumSepolia : sepolia;
  const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';
  const rpcUrl =
    import.meta.env.VITE_EVM_RPC_URL || selectedChain.rpcUrls.public?.http?.[0] || '';

  const solanaEndpoint = import.meta.env.VITE_SOLANA_RPC_URL || 'https://api.devnet.solana.com';
  const solanaWallets = useMemo(
    () => (chainType === 'solana' ? [new PhantomWalletAdapter(), new SolflareWalletAdapter()] : []),
    [chainType]
  );

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
    <ConnectionProvider endpoint={solanaEndpoint}>
      <SolanaWalletProvider wallets={solanaWallets} autoConnect={chainType === 'solana'}>
        <WalletModalProvider>
          {chainType === 'solana' ? (
            children
          ) : (
            <WagmiProvider config={wagmiConfig}>
              <RainbowKitProvider modalSize="compact">{children}</RainbowKitProvider>
            </WagmiProvider>
          )}
        </WalletModalProvider>
      </SolanaWalletProvider>
    </ConnectionProvider>
  );
};

export type { ChainType };
