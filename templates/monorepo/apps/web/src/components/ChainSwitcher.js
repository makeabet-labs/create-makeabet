import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useState } from 'react';
import { Menu, Button, Group, Text, Stack } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconCheck, IconChevronDown, IconAlertCircle } from '@tabler/icons-react';
import { useChain } from '../providers/ChainProvider';
// Chain icons/emojis mapping
const CHAIN_ICONS = {
    'local-hardhat': '🔧',
    'sepolia': '🔷',
    'arbitrum-sepolia': '🔵',
    'solana-devnet': '🟣',
};
export function ChainSwitcher({ size = 'md' }) {
    const { chain, chainKey, setChain, availableChains } = useChain();
    const [isLoading, setIsLoading] = useState(false);
    const handleChainSelect = async (key) => {
        // Don't switch if already on this chain
        if (key === chainKey) {
            return;
        }
        // Check if local chain is available
        const selectedChain = availableChains.find((c) => c.key === key);
        if (!selectedChain) {
            return;
        }
        if (key === 'local-hardhat' && import.meta.env.VITE_LOCAL_CHAIN_ENABLED !== 'true') {
            // Local chain not available
            notifications.show({
                title: 'Local Chain Not Available',
                message: 'Please start the local Hardhat node first with `pnpm chain`',
                color: 'yellow',
                icon: _jsx(IconAlertCircle, { size: 18 }),
            });
            return;
        }
        setIsLoading(true);
        // Store the previous chain in case we need to revert
        const previousChainKey = chainKey;
        try {
            // Small delay to show loading state
            await new Promise((resolve) => setTimeout(resolve, 100));
            // Attempt to switch chain
            setChain(key);
            // Store selected chain in localStorage (already done in ChainProvider)
            // Show success notification
            notifications.show({
                title: 'Chain Switched',
                message: `Successfully switched to ${selectedChain.name}`,
                color: 'teal',
                autoClose: 3000,
            });
        }
        catch (error) {
            console.error('Failed to switch chain:', error);
            // Revert to previous chain on error
            setChain(previousChainKey);
            // Show error notification
            notifications.show({
                title: 'Chain Switch Failed',
                message: error instanceof Error ? error.message : 'Failed to switch chain. Please try again.',
                color: 'red',
                icon: _jsx(IconAlertCircle, { size: 18 }),
            });
        }
        finally {
            setIsLoading(false);
        }
    };
    const isLocalChainAvailable = import.meta.env.VITE_LOCAL_CHAIN_ENABLED === 'true';
    return (_jsxs(Menu, { shadow: "md", width: 280, position: "bottom-end", transitionProps: { transition: 'pop-top-right', duration: 150 }, children: [_jsx(Menu.Target, { children: _jsx(Button, { variant: "default", size: size, rightSection: _jsx(IconChevronDown, { size: 16 }), loading: isLoading, style: {
                        transition: 'all 0.2s ease',
                    }, children: _jsxs(Group, { gap: "xs", wrap: "nowrap", children: [_jsx(Text, { size: "lg", style: { lineHeight: 1 }, children: CHAIN_ICONS[chainKey] }), _jsx(Text, { size: "sm", fw: 500, style: {
                                    whiteSpace: 'nowrap',
                                    overflow: 'hidden',
                                    textOverflow: 'ellipsis',
                                }, children: chain.name })] }) }) }), _jsxs(Menu.Dropdown, { children: [_jsx(Menu.Label, { fw: 600, c: "dimmed", children: "Select Network" }), availableChains.map((availableChain) => {
                        const isSelected = availableChain.key === chainKey;
                        const isDisabled = availableChain.key === 'local-hardhat' && !isLocalChainAvailable;
                        return (_jsx(Menu.Item, { onClick: () => handleChainSelect(availableChain.key), disabled: isDisabled, leftSection: _jsx(Text, { size: "lg", style: {
                                    width: 28,
                                    textAlign: 'center',
                                    lineHeight: 1,
                                }, children: CHAIN_ICONS[availableChain.key] }), rightSection: isSelected ? (_jsx(IconCheck, { size: 18, style: {
                                    color: 'var(--mantine-color-teal-6)',
                                    flexShrink: 0,
                                } })) : null, style: {
                                opacity: isDisabled ? 0.5 : 1,
                                cursor: isDisabled ? 'not-allowed' : 'pointer',
                                padding: '10px 12px',
                                transition: 'all 0.15s ease',
                                backgroundColor: isSelected ? 'var(--mantine-color-teal-0)' : 'transparent',
                            }, children: _jsxs(Stack, { gap: 2, children: [_jsx(Text, { size: "sm", fw: isSelected ? 600 : 500, children: availableChain.name }), _jsxs(Text, { size: "xs", c: "dimmed", style: { lineHeight: 1.3 }, children: [availableChain.chainType === 'evm' ? 'EVM' : 'Solana', availableChain.key === 'local-hardhat' && !isLocalChainAvailable && ' • Not Running'] })] }) }, availableChain.key));
                    })] })] }));
}
