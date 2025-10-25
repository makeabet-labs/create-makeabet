import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState, useEffect, useCallback } from 'react';
import { Button, Text, Stack, Group, Anchor } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDroplet, IconExternalLink } from '@tabler/icons-react';
import { useChain } from '../providers/ChainProvider';
const COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes
const STORAGE_KEY = 'makeabet:faucet:lastRequest';
/**
 * Requests test tokens from the local faucet
 */
async function requestFaucet(address) {
    const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
    const response = await fetch(`${apiUrl}/faucet`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address }),
    });
    if (!response.ok) {
        const data = await response.json().catch(() => ({ ok: false, error: 'Network error' }));
        throw new Error(data.error || `HTTP ${response.status}`);
    }
    return response.json();
}
/**
 * Gets the last request timestamp from localStorage
 */
function getLastRequestTime(address) {
    if (typeof window === 'undefined')
        return null;
    try {
        const stored = window.localStorage.getItem(`${STORAGE_KEY}:${address}`);
        return stored ? parseInt(stored, 10) : null;
    }
    catch {
        return null;
    }
}
/**
 * Stores the request timestamp in localStorage
 */
function setLastRequestTime(address, timestamp) {
    if (typeof window === 'undefined')
        return;
    try {
        window.localStorage.setItem(`${STORAGE_KEY}:${address}`, timestamp.toString());
    }
    catch {
        // Ignore storage errors
    }
}
/**
 * Calculates remaining cooldown time in seconds
 */
function getCooldownRemaining(address) {
    const lastRequest = getLastRequestTime(address);
    if (!lastRequest)
        return 0;
    const elapsed = Date.now() - lastRequest;
    const remaining = COOLDOWN_MS - elapsed;
    return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}
/**
 * Formats seconds into MM:SS format
 */
function formatCooldown(seconds) {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}
export function Faucet({ address, onSuccess, onError }) {
    const { getExplorerUrl } = useChain();
    const [isLoading, setIsLoading] = useState(false);
    const [cooldownSeconds, setCooldownSeconds] = useState(() => getCooldownRemaining(address));
    const [lastTxHashes, setLastTxHashes] = useState([]);
    // Update cooldown timer every second
    useEffect(() => {
        if (cooldownSeconds <= 0)
            return;
        const interval = setInterval(() => {
            const remaining = getCooldownRemaining(address);
            setCooldownSeconds(remaining);
            if (remaining <= 0) {
                clearInterval(interval);
            }
        }, 1000);
        return () => clearInterval(interval);
    }, [cooldownSeconds, address]);
    const handleRequest = useCallback(async () => {
        setIsLoading(true);
        setLastTxHashes([]);
        try {
            const result = await requestFaucet(address);
            if (result.ok && result.transactions) {
                // Store request timestamp
                setLastRequestTime(address, Date.now());
                setCooldownSeconds(COOLDOWN_MS / 1000);
                setLastTxHashes(result.transactions);
                notifications.show({
                    title: 'Faucet Success!',
                    message: `Sent test tokens to your wallet. ${result.transactions.length} transaction(s) completed.`,
                    color: 'teal',
                    autoClose: 5000,
                });
                onSuccess?.(result.transactions);
            }
            else {
                throw new Error(result.error || 'Unknown error');
            }
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Failed to request faucet';
            notifications.show({
                title: 'Faucet Failed',
                message: errorMessage,
                color: 'red',
                autoClose: 5000,
            });
            onError?.(errorMessage);
        }
        finally {
            setIsLoading(false);
        }
    }, [address, onSuccess, onError]);
    const isDisabled = isLoading || cooldownSeconds > 0;
    return (_jsxs(Stack, { gap: "xs", children: [_jsx(Button, { variant: "light", color: "blue", fullWidth: true, leftSection: _jsx(IconDroplet, { size: 16 }), onClick: handleRequest, loading: isLoading, disabled: isDisabled, children: cooldownSeconds > 0
                    ? `Wait ${formatCooldown(cooldownSeconds)}`
                    : 'Request Faucet' }), lastTxHashes.length > 0 && (_jsxs(Stack, { gap: 4, children: [_jsx(Text, { size: "xs", c: "dimmed", children: "Recent transactions:" }), lastTxHashes.map((hash) => {
                        const explorerUrl = getExplorerUrl('tx', hash);
                        return (_jsxs(Group, { gap: 4, wrap: "nowrap", children: [_jsxs(Text, { size: "xs", style: { fontFamily: 'monospace' }, children: [hash.slice(0, 10), "...", hash.slice(-8)] }), explorerUrl && (_jsx(Anchor, { href: explorerUrl, target: "_blank", rel: "noopener noreferrer", size: "xs", children: _jsx(IconExternalLink, { size: 12 }) }))] }, hash));
                    })] }))] }));
}
