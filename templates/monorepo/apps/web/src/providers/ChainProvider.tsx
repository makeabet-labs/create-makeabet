import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { CHAIN_METADATA, DEFAULT_CHAIN_KEY, type ChainKey, type ChainMetadata } from '../config/chains';

interface ChainContextValue {
  chain: ChainMetadata;
  chainKey: ChainKey;
  setChain: (key: ChainKey) => void;
  availableChains: ChainMetadata[];
  isLocalChain: boolean;
  isFaucetAvailable: boolean;
  getExplorerUrl: (type: 'address' | 'tx', value: string) => string | null;
}

const ChainContext = createContext<ChainContextValue | undefined>(undefined);
const STORAGE_KEY = 'makeabet:chain';

export function ChainProvider({ children }: { children: ReactNode }) {
  const [chainKey, setChainKey] = useState<ChainKey>(() => {
    if (typeof window === 'undefined') {
      return DEFAULT_CHAIN_KEY;
    }
    const stored = window.localStorage.getItem(STORAGE_KEY) as ChainKey | null;
    return stored && CHAIN_METADATA[stored] ? stored : DEFAULT_CHAIN_KEY;
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, chainKey);
    }
  }, [chainKey]);

  const setChain = (key: ChainKey) => {
    if (CHAIN_METADATA[key]) {
      setChainKey(key);
    }
  };

  const isLocalChain = useMemo(() => chainKey === 'local-hardhat', [chainKey]);

  const isFaucetAvailable = useMemo(() => {
    return isLocalChain && import.meta.env.VITE_LOCAL_CHAIN_ENABLED === 'true';
  }, [isLocalChain]);

  const getExplorerUrl = (type: 'address' | 'tx', value: string): string | null => {
    const chain = CHAIN_METADATA[chainKey];
    
    // Local chain has no block explorer
    if (chainKey === 'local-hardhat') {
      return null;
    }

    if (type === 'address' && chain.blockExplorerAddressTemplate) {
      return chain.blockExplorerAddressTemplate.replace('{address}', value);
    }

    if (type === 'tx' && chain.explorerUrl) {
      return `${chain.explorerUrl}/tx/${value}`;
    }

    return null;
  };

  const value = useMemo<ChainContextValue>(
    () => ({
      chainKey,
      chain: CHAIN_METADATA[chainKey],
      setChain,
      availableChains: Object.values(CHAIN_METADATA),
      isLocalChain,
      isFaucetAvailable,
      getExplorerUrl,
    }),
    [chainKey, isLocalChain, isFaucetAvailable]
  );

  return <ChainContext.Provider value={value}>{children}</ChainContext.Provider>;
}

export function useChain() {
  const ctx = useContext(ChainContext);
  if (!ctx) {
    throw new Error('useChain must be used within ChainProvider');
  }
  return ctx;
}
