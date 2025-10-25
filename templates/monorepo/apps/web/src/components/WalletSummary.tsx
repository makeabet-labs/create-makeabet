import { useAccount } from 'wagmi';
import { useWallet } from '@solana/wallet-adapter-react';
import { Card, Group, Text, Stack, Skeleton, ActionIcon, Tooltip, Anchor } from '@mantine/core';
import { IconCopy, IconExternalLink } from '@tabler/icons-react';
import { notifications } from '@mantine/notifications';
import { useChain } from '../providers/ChainProvider';
import { useNativeBalance, usePyusdBalance } from '../wallet/hooks';
import { Faucet } from './Faucet';

interface WalletSummaryProps {
  showFaucet?: boolean;
  showExplorerLink?: boolean;
}

/**
 * Formats an address to show first 6 and last 4 characters
 * e.g., 0x1234567890abcdef -> 0x1234...cdef
 */
function formatAddress(address: string): string {
  if (!address || address.length < 10) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Copies text to clipboard and shows a notification
 */
async function copyToClipboard(text: string, label: string = 'Address') {
  try {
    await navigator.clipboard.writeText(text);
    notifications.show({
      title: 'Copied!',
      message: `${label} copied to clipboard`,
      color: 'teal',
      autoClose: 2000,
    });
  } catch (error) {
    notifications.show({
      title: 'Copy Failed',
      message: 'Failed to copy to clipboard',
      color: 'red',
      autoClose: 3000,
    });
  }
}

export function WalletSummary({ 
  showFaucet = true, 
  showExplorerLink = true 
}: WalletSummaryProps) {
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
    return (
      <Card shadow="sm" padding="lg" radius="md" withBorder>
        <Text size="sm" c="dimmed" ta="center">
          Connect your wallet to view balance
        </Text>
      </Card>
    );
  }

  return (
    <Card shadow="sm" padding="lg" radius="md" withBorder>
      <Stack gap="md">
        {/* Header */}
        <Group justify="space-between" align="center">
          <Text size="lg" fw={600}>
            Wallet Summary
          </Text>
        </Group>

        {/* Wallet Address */}
        <Group gap="xs" wrap="nowrap">
          <Text size="sm" fw={500} style={{ flex: 1 }}>
            {formatAddress(walletAddress)}
          </Text>
          
          <Tooltip label="Copy address" position="top">
            <ActionIcon
              variant="subtle"
              color="gray"
              size="sm"
              onClick={() => copyToClipboard(walletAddress, 'Address')}
            >
              <IconCopy size={16} />
            </ActionIcon>
          </Tooltip>

          {explorerUrl && (
            <Tooltip label="View on explorer" position="top">
              <ActionIcon
                component="a"
                href={explorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                variant="subtle"
                color="blue"
                size="sm"
              >
                <IconExternalLink size={16} />
              </ActionIcon>
            </Tooltip>
          )}
        </Group>

        {/* Native Token Balance */}
        <Stack gap={4}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            {chain.nativeSymbol} Balance
          </Text>
          {nativeBalance.isLoading ? (
            <Skeleton height={24} width="60%" />
          ) : nativeBalance.error ? (
            <Text size="sm" c="red">
              Error loading balance
            </Text>
          ) : (
            <Text size="md" fw={500}>
              {parseFloat(nativeBalance.formatted).toFixed(4)} {chain.nativeSymbol}
            </Text>
          )}
        </Stack>

        {/* PYUSD Balance */}
        <Stack gap={4}>
          <Text size="xs" c="dimmed" tt="uppercase" fw={600}>
            {chain.stableSymbol} Balance
          </Text>
          {pyusdBalance.isLoading ? (
            <Skeleton height={24} width="60%" />
          ) : pyusdBalance.error ? (
            <Text size="sm" c="red">
              Error loading balance
            </Text>
          ) : !pyusdBalance.tokenConfigured ? (
            <Text size="sm" c="dimmed">
              Token not configured
            </Text>
          ) : (
            <Text size="md" fw={500}>
              {parseFloat(pyusdBalance.formatted).toFixed(2)} {chain.stableSymbol}
            </Text>
          )}
        </Stack>

        {/* Faucet - Only show on local chain */}
        {showFaucet && isFaucetAvailable && (
          <Faucet 
            address={walletAddress}
            onSuccess={(txHashes) => {
              // Refresh balances after successful faucet request
              nativeBalance.refetch?.();
              pyusdBalance.refetch?.();
            }}
          />
        )}
      </Stack>
    </Card>
  );
}
