import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, Group, Text, Stack, Skeleton, ActionIcon, Tooltip } from '@mantine/core';
import { IconCopy, IconExternalLink } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useChain } from '../providers/ChainProvider';
import { useNativeBalance, usePyusdBalance } from '../wallet/hooks';
import { Faucet } from './Faucet';
/**
 * Formats an address to show first 6 and last 4 characters
 * e.g., 0x1234567890abcdef -> 0x1234...cdef
 */
function formatAddress(address) {
    if (!address || address.length < 10)
        return address;
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
}
/**
 * Copies text to clipboard and shows a notification
 */
async function copyToClipboard(text, label = 'Address') {
    try {
        await navigator.clipboard.writeText(text);
        notifications.show({
            title: 'Copied!',
            message: `${label} copied to clipboard`,
            color: 'teal',
            autoClose: 2000,
        });
    }
    catch (error) {
        notifications.show({
            title: 'Copy Failed',
            message: 'Failed to copy to clipboard',
            color: 'red',
            autoClose: 3000,
        });
    }
}
export function WalletSummary({ showFaucet = true, showExplorerLink = true }) {
    const { chain, getExplorerUrl, isFaucetAvailable } = useChain();
    // Get wallet address based on chain type
    const { address: evmAddress, isConnected: evmConnected } = useAccount();
    const { publicKey: solanaPublicKey } = useWallet();
    const isConnected = chain.chainType === 'evm' ? evmConnected : Boolean(solanaPublicKey);
    const walletAddress = chain.chainType === 'evm'
        ? evmAddress
        : solanaPublicKey?.toBase58();
    // Fetch balances
    const nativeBalance = useNativeBalance();
    const pyusdBalance = usePyusdBalance();
    // Get explorer URL for the connected address
    const explorerUrl = walletAddress && showExplorerLink
        ? getExplorerUrl('address', walletAddress)
        : null;
    if (!isConnected || !walletAddress) {
        return (_jsx(Card, { shadow: "sm", padding: "lg", radius: "md", withBorder: true, children: _jsx(Text, { size: "sm", c: "dimmed", ta: "center", children: "Connect your wallet to view balance" }) }));
    }
    return (_jsx(Card, { shadow: "sm", padding: "lg", radius: "md", withBorder: true, children: _jsxs(Stack, { gap: "md", children: [_jsx(Group, { justify: "space-between", align: "center", children: _jsx(Text, { size: "lg", fw: 600, children: "Wallet Summary" }) }), _jsxs(Group, { gap: "xs", wrap: "nowrap", children: [_jsx(Text, { size: "sm", fw: 500, style: { flex: 1 }, children: formatAddress(walletAddress) }), _jsx(Tooltip, { label: "Copy address", position: "top", children: _jsx(ActionIcon, { variant: "subtle", color: "gray", size: "sm", onClick: () => copyToClipboard(walletAddress, 'Address'), children: _jsx(IconCopy, { size: 16 }) }) }), explorerUrl && (_jsx(Tooltip, { label: "View on explorer", position: "top", children: _jsx(ActionIcon, { component: "a", href: explorerUrl, target: "_blank", rel: "noopener noreferrer", variant: "subtle", color: "blue", size: "sm", children: _jsx(IconExternalLink, { size: 16 }) }) }))] }), _jsxs(Stack, { gap: 4, children: [_jsxs(Text, { size: "xs", c: "dimmed", tt: "uppercase", fw: 600, children: [chain.nativeSymbol, " Balance"] }), nativeBalance.isLoading ? (_jsx(Skeleton, { height: 24, width: "60%" })) : nativeBalance.error ? (_jsx(Text, { size: "sm", c: "red", children: "Error loading balance" })) : (_jsxs(Text, { size: "md", fw: 500, children: [parseFloat(nativeBalance.formatted).toFixed(4), " ", chain.nativeSymbol] }))] }), _jsxs(Stack, { gap: 4, children: [_jsxs(Text, { size: "xs", c: "dimmed", tt: "uppercase", fw: 600, children: [chain.stableSymbol, " Balance"] }), pyusdBalance.isLoading ? (_jsx(Skeleton, { height: 24, width: "60%" })) : pyusdBalance.error ? (_jsx(Text, { size: "sm", c: "red", children: "Error loading balance" })) : !pyusdBalance.tokenConfigured ? (_jsx(Text, { size: "sm", c: "dimmed", children: "Token not configured" })) : (_jsxs(Text, { size: "md", fw: 500, children: [parseFloat(pyusdBalance.formatted).toFixed(2), " ", chain.stableSymbol] }))] }), showFaucet && isFaucetAvailable && (_jsx(Faucet, { address: walletAddress, onSuccess: (txHashes) => {
                        // Refresh balances after successful faucet request
                        nativeBalance.refetch?.();
                        pyusdBalance.refetch?.();
                    } }))] }) }));
}
