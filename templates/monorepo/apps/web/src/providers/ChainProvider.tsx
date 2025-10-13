import { createContext, ReactNode, useContext, useMemo, useState } from 'react';

import { CHAIN_METADATA, DEFAULT_CHAIN_KEY, type ChainKey, type ChainMetadata } from '../config/chains';

interface ChainContextValue {
  chain: ChainMetadata;
  chainKey: ChainKey;
  setChain: (key: ChainKey) => void;
  availableChains: ChainMetadata[];
}

const ChainContext = createContext<ChainContextValue | undefined>(undefined);

export function ChainProvider({ children }: { children: ReactNode }) {
  const [chainKey, setChainKey] = useState<ChainKey>(DEFAULT_CHAIN_KEY);

  const value = useMemo<ChainContextValue>(
    () => ({
      chainKey,
      chain: CHAIN_METADATA[chainKey],
      setChain: setChainKey,
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
