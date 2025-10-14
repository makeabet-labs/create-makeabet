import { arbitrumSepolia, sepolia } from 'wagmi/chains';
import { createConfig, http } from 'wagmi';
import { coinbaseWallet, injected, walletConnect } from 'wagmi/connectors';

const defaultProjectId = 'demo-walletconnect-project';
const projectId = import.meta.env.VITE_WALLETCONNECT_PROJECT_ID ?? defaultProjectId;

export const chains = [sepolia, arbitrumSepolia];

export const wagmiConfig = createConfig({
  chains,
  connectors: [
    injected({ shimDisconnect: true }),
    coinbaseWallet({ appName: 'MakeABet' }),
    walletConnect({ projectId }),
  ],
  transports: chains.reduce((acc, chain) => {
    const rpcUrl = chain.rpcUrls.default.http[0];
    acc[chain.id] = http(rpcUrl);
    return acc;
  }, {} as Record<number, ReturnType<typeof http>>),
  ssr: true,
  autoConnect: true,
});
