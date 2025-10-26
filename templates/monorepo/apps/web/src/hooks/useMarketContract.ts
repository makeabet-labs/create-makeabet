import { useAccount, useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { parseUnits, formatUnits } from 'viem';
import { useState, useEffect } from 'react';

// Market contract ABI (only the functions we need)
const MARKET_ABI = [
  {
    inputs: [
      { name: 'question', type: 'string' },
      { name: 'priceFeedId', type: 'bytes32' },
      { name: 'targetPrice', type: 'int64' },
      { name: 'expiry', type: 'uint64' }
    ],
    name: 'createMarket',
    outputs: [{ name: 'marketId', type: 'uint256' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'isBullish', type: 'bool' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'placeBet',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [{ name: 'marketId', type: 'uint256' }],
    name: 'getMarket',
    outputs: [{
      components: [
        { name: 'question', type: 'string' },
        { name: 'priceFeedId', type: 'bytes32' },
        { name: 'targetPrice', type: 'int64' },
        { name: 'expiry', type: 'uint64' },
        { name: 'settled', type: 'bool' },
        { name: 'outcome', type: 'bool' },
        { name: 'bullishPool', type: 'uint256' },
        { name: 'bearishPool', type: 'uint256' }
      ],
      name: '',
      type: 'tuple'
    }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [
      { name: 'marketId', type: 'uint256' },
      { name: 'user', type: 'address' }
    ],
    name: 'getUserBet',
    outputs: [{
      components: [
        { name: 'isBullish', type: 'bool' },
        { name: 'amount', type: 'uint256' },
        { name: 'claimed', type: 'bool' }
      ],
      name: '',
      type: 'tuple'
    }],
    stateMutability: 'view',
    type: 'function'
  },
  {
    inputs: [{ name: 'marketId', type: 'uint256' }],
    name: 'claimWinnings',
    outputs: [],
    stateMutability: 'nonpayable',
    type: 'function'
  }
] as const;

// ERC20 ABI for PYUSD
const ERC20_ABI = [
  {
    inputs: [
      { name: 'spender', type: 'address' },
      { name: 'amount', type: 'uint256' }
    ],
    name: 'approve',
    outputs: [{ name: '', type: 'bool' }],
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      { name: 'owner', type: 'address' },
      { name: 'spender', type: 'address' }
    ],
    name: 'allowance',
    outputs: [{ name: '', type: 'uint256' }],
    stateMutability: 'view',
    type: 'function'
  }
] as const;

export function useMarketContract(marketAddress?: string, pyusdAddress?: string) {
  const { address } = useAccount();
  const { writeContractAsync } = useWriteContract();

  // Place bet function
  const placeBet = async (marketId: number, isBullish: boolean, amount: number) => {
    if (!marketAddress || !pyusdAddress || !address) {
      throw new Error('Contract addresses or user address not available');
    }

    const amountInWei = parseUnits(amount.toString(), 6); // PYUSD has 6 decimals

    // First, approve PYUSD spending
    const approveTx = await writeContractAsync({
      address: pyusdAddress as `0x${string}`,
      abi: ERC20_ABI,
      functionName: 'approve',
      args: [marketAddress as `0x${string}`, amountInWei],
    });

    console.log('Approve tx:', approveTx);

    // Then place bet
    const betTx = await writeContractAsync({
      address: marketAddress as `0x${string}`,
      abi: MARKET_ABI,
      functionName: 'placeBet',
      args: [BigInt(marketId), isBullish, amountInWei],
    });

    console.log('Bet tx:', betTx);
    return betTx;
  };

  // Create market function
  const createMarket = async (
    question: string,
    priceFeedId: string,
    targetPrice: number,
    expiry: number
  ) => {
    if (!marketAddress) {
      throw new Error('Market address not available');
    }

    // Convert target price to int64 format (price * 10^8 for Pyth format)
    const targetPriceScaled = BigInt(Math.floor(targetPrice * 1e8));
    
    const tx = await writeContractAsync({
      address: marketAddress as `0x${string}`,
      abi: MARKET_ABI,
      functionName: 'createMarket',
      args: [
        question,
        priceFeedId as `0x${string}`,
        targetPriceScaled,
        BigInt(expiry)
      ],
    });

    console.log('Create market tx:', tx);
    return tx;
  };

  return {
    placeBet,
    createMarket,
    MARKET_ABI,
    ERC20_ABI,
  };
}

// Hook to read market data
export function useMarketData(marketAddress?: string, marketId?: number) {
  const { data, isLoading, refetch } = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: MARKET_ABI,
    functionName: 'getMarket',
    args: marketId !== undefined ? [BigInt(marketId)] : undefined,
    query: {
      enabled: !!marketAddress && marketId !== undefined,
    },
  });

  return {
    market: data,
    isLoading,
    refetch,
  };
}

// Hook to read user bet
export function useUserBet(marketAddress?: string, marketId?: number, userAddress?: string) {
  const { data, isLoading, refetch } = useReadContract({
    address: marketAddress as `0x${string}`,
    abi: MARKET_ABI,
    functionName: 'getUserBet',
    args: marketId !== undefined && userAddress ? [BigInt(marketId), userAddress as `0x${string}`] : undefined,
    query: {
      enabled: !!marketAddress && marketId !== undefined && !!userAddress,
    },
  });

  return {
    bet: data,
    isLoading,
    refetch,
  };
}
