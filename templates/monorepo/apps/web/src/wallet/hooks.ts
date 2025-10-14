import { formatUnits, erc20Abi } from 'viem';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { PYUSD_TOKEN_ADDRESSES, PYUSD_DECIMALS } from './tokenMap';

type PyusdBalanceResult = {
  formatted: string;
  raw: bigint | undefined;
  isLoading: boolean;
  tokenConfigured: boolean;
};

type NativeBalanceResult = {
  formatted: string;
  raw: bigint | undefined;
  isLoading: boolean;
};

export function usePyusdBalance(): PyusdBalanceResult {
  const { address, chainId, isConnected } = useAccount();
  const tokenAddress = chainId ? PYUSD_TOKEN_ADDRESSES[chainId] : undefined;

  const { data, isLoading } = useReadContract({
    address: tokenAddress,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: Boolean(isConnected && address && tokenAddress),
      refetchInterval: 10_000,
    },
  });

  const formatted = data !== undefined ? formatUnits(data, PYUSD_DECIMALS) : '0';

  return {
    formatted,
    raw: data,
    isLoading,
    tokenConfigured: Boolean(tokenAddress),
  };
}

export function useNativeBalance(): NativeBalanceResult {
  const { address, chainId, isConnected } = useAccount();
  const { data, isLoading } = useBalance({
    address,
    chainId,
    query: {
      enabled: Boolean(isConnected && address && chainId),
      refetchInterval: 10_000,
    },
  });

  return {
    formatted: data?.formatted ?? '0',
    raw: data?.value,
    isLoading,
  };
}
