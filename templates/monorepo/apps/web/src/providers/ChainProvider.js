import { jsx as _jsx } from "react/jsx-runtime";
import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { CHAIN_METADATA, DEFAULT_CHAIN_KEY } from '../config/chains';
const ChainContext = createContext(undefined);
const STORAGE_KEY = 'makeabet:chain';
export function ChainProvider({ children }) {
    const [chainKey, setChainKey] = useState(() => {
        if (typeof window === 'undefined') {
            return DEFAULT_CHAIN_KEY;
        }
        const stored = window.localStorage.getItem(STORAGE_KEY);
        return stored && CHAIN_METADATA[stored] ? stored : DEFAULT_CHAIN_KEY;
    });
    useEffect(() => {
        if (typeof window !== 'undefined') {
            window.localStorage.setItem(STORAGE_KEY, chainKey);
        }
    }, [chainKey]);
    const setChain = (key) => {
        if (CHAIN_METADATA[key]) {
            setChainKey(key);
        }
    };
    const value = useMemo(() => ({
        chainKey,
        chain: CHAIN_METADATA[chainKey],
        setChain,
        availableChains: Object.values(CHAIN_METADATA),
    }), [chainKey]);
    return _jsx(ChainContext.Provider, { value: value, children: children });
}
export function useChain() {
    const ctx = useContext(ChainContext);
    if (!ctx) {
        throw new Error('useChain must be used within ChainProvider');
    }
    return ctx;
}
