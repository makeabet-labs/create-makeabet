import { useCallback, useEffect, useRef } from 'react';
import { formatUnits, erc20Abi } from 'viem';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { PYUSD_TOKEN_ADDRESSES, PYUSD_DECIMALS } from './tokenMap';
import { useChain } from '../providers/ChainProvider';

type PyusdBalanceResult = {
  formatted: string;
  raw: bigint | undefined;
  isLoading: boolean;
  error: Error | null;
  tokenConfigured: boolean;
  refetch: () => void;
};

type NativeBalanceResult = {
  formatted: string;
  raw: bigint | undefined;
  isLoading: boolean;
  error: Error | null;
  refetch: () => void;
};

/**
 * Hook to fetch native ETH balance
 * Automatically refreshes on chain change and supports manual refetch
 */
export function useNativeBalance(): NativeBalanceResult {
  const { chain } = useChain();
  const { address, chainId, isConnected } = useAccount();

  // EVM balance
  const { data, isLoading, error, refetch: evmRefetch } = useBalance({
    address,
    chainId,
    query: {
      enabled: Boolean(isConnected && address && chainId),
      refetchInterval: 10_000,
    },
  });

  // Debounced refetch
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refetch = useCallback(() => {
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }

    refetchTimeoutRef.current = setTimeout(() => {
      evmRefetch();
    }, 100); // 100ms debounce
  }, [evmRefetch]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, []);

  return {
    formatted: data?.formatted ?? '0',
    raw: data?.value,
    isLoading,
    error: error as Error | null,
    refetch,
  };
}

/**
 * Hook to fetch PYUSD ERC20 token balance
 * Automatically refreshes on chain change and supports manual refetch
 */
export function usePyusdBalance(): PyusdBalanceResult {
  const { chain } = useChain();
  const { address, chainId, isConnected } = useAccount();

  // Get PYUSD address from chain metadata or token map
  const evmTokenAddress = chainId ? PYUSD_TOKEN_ADDRESSES[chainId] : undefined;
  const pyusdAddress = chain.pyusdAddress || evmTokenAddress;

  // EVM PYUSD balance
  const { data, isLoading, error, refetch: evmRefetch } = useReadContract({
    address: pyusdAddress as `0x${string}` | undefined,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(isConnected && address && pyusdAddress),
      refetchInterval: 10_000,
    },
  });

  // Debounced refetch
  const refetchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const refetch = useCallback(() => {
    if (refetchTimeoutRef.current) {
      clearTimeout(refetchTimeoutRef.current);
    }

    refetchTimeoutRef.current = setTimeout(() => {
      evmRefetch();
    }, 100); // 100ms debounce
  }, [evmRefetch]);

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (refetchTimeoutRef.current) {
        clearTimeout(refetchTimeoutRef.current);
      }
    };
  }, []);

  const formatted = data !== undefined ? formatUnits(data, PYUSD_DECIMALS) : '0';

  return {
    formatted,
    raw: data,
    isLoading,
    error: error as Error | null,
    tokenConfigured: Boolean(pyusdAddress),
    refetch,
  };
}
