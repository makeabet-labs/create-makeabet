import { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';

import { CHAIN_METADATA, DEFAULT_CHAIN_KEY, type ChainKey, type ChainMetadata } from '../config/chains';

interface ChainContextValue {
  chain: ChainMetadata;
  chainKey: ChainKey;
  setChain: (key: ChainKey) => void;
  availableChains: ChainMetadata[];
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

  const value = useMemo<ChainContextValue>(
    () => ({
      chainKey,
      chain: CHAIN_METADATA[chainKey],
      setChain,
      availableChains: Object.values(CHAIN_METADATA),
    }),
    [chainKey]
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
