import { useCallback, useEffect, useRef, useState } from 'react';
import { formatUnits, erc20Abi } from 'viem';
import { useAccount, useBalance, useReadContract } from 'wagmi';
import { useConnection, useWallet } from '@solana/wallet-adapter-react';
import { PublicKey } from '@solana/web3.js';
import { PYUSD_TOKEN_ADDRESSES, PYUSD_DECIMALS } from './tokenMap';
import { useChain } from '../providers/ChainProvider';
/**
 * Hook to fetch native token balance (ETH for EVM, SOL for Solana)
 * Automatically refreshes on chain change and supports manual refetch
 */
export function useNativeBalance() {
    const { chain } = useChain();
    const { address, chainId, isConnected } = useAccount();
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    // EVM balance
    const { data, isLoading, error, refetch: evmRefetch } = useBalance({
        address,
        chainId,
        query: {
            enabled: Boolean(isConnected && address && chainId && chain.chainType === 'evm'),
            refetchInterval: 10_000,
        },
    });
    // Solana balance state
    const [solanaBalance, setSolanaBalance] = useState(undefined);
    const [solanaLoading, setSolanaLoading] = useState(false);
    const [solanaError, setSolanaError] = useState(null);
    // Fetch Solana balance
    const fetchSolanaBalance = useCallback(async () => {
        if (chain.chainType !== 'solana' || !publicKey || !connection) {
            return;
        }
        setSolanaLoading(true);
        setSolanaError(null);
        try {
            const balance = await connection.getBalance(publicKey);
            // Convert lamports to SOL (1 SOL = 1e9 lamports)
            setSolanaBalance(BigInt(balance));
        }
        catch (err) {
            setSolanaError(err instanceof Error ? err : new Error('Failed to fetch SOL balance'));
        }
        finally {
            setSolanaLoading(false);
        }
    }, [chain.chainType, publicKey, connection]);
    // Auto-fetch Solana balance on mount and when dependencies change
    useEffect(() => {
        if (chain.chainType === 'solana') {
            fetchSolanaBalance();
        }
    }, [chain.chainType, fetchSolanaBalance]);
    // Debounced refetch
    const refetchTimeoutRef = useRef(null);
    const refetch = useCallback(() => {
        if (refetchTimeoutRef.current) {
            clearTimeout(refetchTimeoutRef.current);
        }
        refetchTimeoutRef.current = setTimeout(() => {
            if (chain.chainType === 'evm') {
                evmRefetch();
            }
            else if (chain.chainType === 'solana') {
                fetchSolanaBalance();
            }
        }, 100); // 100ms debounce
    }, [chain.chainType, evmRefetch, fetchSolanaBalance]);
    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (refetchTimeoutRef.current) {
                clearTimeout(refetchTimeoutRef.current);
            }
        };
    }, []);
    // Return EVM or Solana balance based on chain type
    if (chain.chainType === 'solana') {
        const formatted = solanaBalance !== undefined
            ? (Number(solanaBalance) / 1e9).toFixed(9)
            : '0';
        return {
            formatted,
            raw: solanaBalance,
            isLoading: solanaLoading,
            error: solanaError,
            refetch,
        };
    }
    return {
        formatted: data?.formatted ?? '0',
        raw: data?.value,
        isLoading,
        error: error,
        refetch,
    };
}
/**
 * Hook to fetch PYUSD token balance
 * Supports both EVM (ERC20) and Solana (SPL token)
 * Automatically refreshes on chain change and supports manual refetch
 */
export function usePyusdBalance() {
    const { chain } = useChain();
    const { address, chainId, isConnected } = useAccount();
    const { connection } = useConnection();
    const { publicKey } = useWallet();
    // Get PYUSD address from chain metadata or token map
    const evmTokenAddress = chainId ? PYUSD_TOKEN_ADDRESSES[chainId] : undefined;
    const pyusdAddress = chain.pyusdAddress || evmTokenAddress;
    const pyusdMint = chain.pyusdMint;
    // EVM PYUSD balance
    const { data, isLoading, error, refetch: evmRefetch } = useReadContract({
        address: pyusdAddress,
        abi: erc20Abi,
        functionName: 'balanceOf',
        args: address ? [address] : undefined,
        query: {
            enabled: Boolean(isConnected && address && pyusdAddress && chain.chainType === 'evm'),
            refetchInterval: 10_000,
        },
    });
    // Solana PYUSD balance state
    const [solanaBalance, setSolanaBalance] = useState(undefined);
    const [solanaLoading, setSolanaLoading] = useState(false);
    const [solanaError, setSolanaError] = useState(null);
    // Fetch Solana SPL token balance
    const fetchSolanaPyusdBalance = useCallback(async () => {
        if (chain.chainType !== 'solana' || !publicKey || !connection || !pyusdMint) {
            return;
        }
        setSolanaLoading(true);
        setSolanaError(null);
        try {
            const mintPubkey = new PublicKey(pyusdMint);
            // Get token accounts for this wallet and mint
            const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
                mint: mintPubkey,
            });
            if (tokenAccounts.value.length > 0) {
                const balance = tokenAccounts.value[0]?.account.data.parsed.info.tokenAmount.amount;
                setSolanaBalance(BigInt(balance || 0));
            }
            else {
                setSolanaBalance(BigInt(0));
            }
        }
        catch (err) {
            setSolanaError(err instanceof Error ? err : new Error('Failed to fetch PYUSD balance'));
            setSolanaBalance(BigInt(0));
        }
        finally {
            setSolanaLoading(false);
        }
    }, [chain.chainType, publicKey, connection, pyusdMint]);
    // Auto-fetch Solana balance on mount and when dependencies change
    useEffect(() => {
        if (chain.chainType === 'solana') {
            fetchSolanaPyusdBalance();
        }
    }, [chain.chainType, fetchSolanaPyusdBalance]);
    // Debounced refetch
    const refetchTimeoutRef = useRef(null);
    const refetch = useCallback(() => {
        if (refetchTimeoutRef.current) {
            clearTimeout(refetchTimeoutRef.current);
        }
        refetchTimeoutRef.current = setTimeout(() => {
            if (chain.chainType === 'evm') {
                evmRefetch();
            }
            else if (chain.chainType === 'solana') {
                fetchSolanaPyusdBalance();
            }
        }, 100); // 100ms debounce
    }, [chain.chainType, evmRefetch, fetchSolanaPyusdBalance]);
    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (refetchTimeoutRef.current) {
                clearTimeout(refetchTimeoutRef.current);
            }
        };
    }, []);
    // Return EVM or Solana balance based on chain type
    if (chain.chainType === 'solana') {
        const formatted = solanaBalance !== undefined
            ? formatUnits(solanaBalance, PYUSD_DECIMALS)
            : '0';
        return {
            formatted,
            raw: solanaBalance,
            isLoading: solanaLoading,
            error: solanaError,
            tokenConfigured: Boolean(pyusdMint),
            refetch,
        };
    }
    const formatted = data !== undefined ? formatUnits(data, PYUSD_DECIMALS) : '0';
    return {
        formatted,
        raw: data,
        isLoading,
        error: error,
        tokenConfigured: Boolean(pyusdAddress),
        refetch,
    };
}
