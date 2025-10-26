import { http, createConfig } from 'wagmi';
import { sepolia, arbitrumSepolia, hardhat, type Chain } from 'wagmi/chains';
import { injected, walletConnect } from 'wagmi/connectors';

// Get WalletConnect project ID from environment
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID || '';

// Define chains - must have at least one chain
const configuredChains: readonly [Chain, ...Chain[]] = [hardhat, sepolia, arbitrumSepolia];

// Create wagmi config
export const wagmiConfig = createConfig({
  chains: configuredChains,
  connectors: [
    injected(),
    walletConnect({
      projectId,
      showQrModal: true,
    }),
  ],
  transports: {
    [hardhat.id]: http(import.meta.env.VITE_LOCAL_RPC_URL || 'http://127.0.0.1:8545'),
    [sepolia.id]: http(),
    [arbitrumSepolia.id]: http(),
  },
});
