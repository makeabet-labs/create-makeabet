import { useState, useEffect, useCallback } from 'react';
import { Button, Text, Stack, Group, Anchor } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { IconDroplet, IconExternalLink } from '@tabler/icons-react';
import { useChain } from '../providers/ChainProvider';

interface FaucetResponse {
  ok: boolean;
  transactions?: string[];
  error?: string;
}

interface FaucetError {
  type: 'rate_limit' | 'validation' | 'network' | 'server' | 'unknown';
  message: string;
  cooldownSeconds?: number;
}

interface FaucetProps {
  address: string;
  onSuccess?: (txHashes: string[]) => void;
  onError?: (error: string) => void;
}

// Cooldown disabled for local development
const COOLDOWN_MS = 0; // No cooldown
const STORAGE_KEY = 'makeabet:faucet:lastRequest';

/**
 * Parses error response and categorizes it
 */
function parseError(status: number, errorMessage: string): FaucetError {
  // Rate limit error (429)
  if (status === 429) {
    const match = errorMessage.match(/wait (\d+) seconds/i);
    const cooldownSeconds = match ? parseInt(match[1], 10) : undefined;
    return {
      type: 'rate_limit',
      message: errorMessage,
      cooldownSeconds,
    };
  }

  // Validation error (400)
  if (status === 400) {
    return {
      type: 'validation',
      message: errorMessage || 'Invalid wallet address',
    };
  }

  // Server error (500)
  if (status === 500) {
    return {
      type: 'server',
      message: errorMessage || 'Faucet service error. Please try again later.',
    };
  }

  // Network/connection errors
  const lowerMsg = errorMessage.toLowerCase();
  if (lowerMsg.includes('network') || lowerMsg.includes('connection') || lowerMsg.includes('fetch')) {
    return {
      type: 'network',
      message: 'Unable to connect to faucet service. Please ensure the API server is running.',
    };
  }

  // Unknown error
  return {
    type: 'unknown',
    message: errorMessage || 'An unexpected error occurred',
  };
}

/**
 * Requests test tokens from the local faucet
 */
async function requestFaucet(address: string): Promise<FaucetResponse> {
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:4000';
  
  try {
    const response = await fetch(`${apiUrl}/api/faucet`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });

    const data = await response.json().catch(() => ({ ok: false, error: 'Invalid response from server' }));

    if (!response.ok) {
      const error = parseError(response.status, data.error || `HTTP ${response.status}`);
      throw error;
    }

    return data;
  } catch (error) {
    // Handle network errors (fetch failures)
    if (error instanceof TypeError && error.message.includes('fetch')) {
      throw parseError(0, 'Network error: Unable to reach faucet service');
    }
    
    // Re-throw if already a FaucetError
    if (error && typeof error === 'object' && 'type' in error) {
      throw error;
    }
    
    // Wrap unknown errors
    throw parseError(0, error instanceof Error ? error.message : 'Unknown error');
  }
}

/**
 * Gets the last request timestamp from localStorage
 */
function getLastRequestTime(address: string): number | null {
  if (typeof window === 'undefined') return null;
  
  try {
    const stored = window.localStorage.getItem(`${STORAGE_KEY}:${address}`);
    return stored ? parseInt(stored, 10) : null;
  } catch {
    return null;
  }
}

/**
 * Stores the request timestamp in localStorage
 */
function setLastRequestTime(address: string, timestamp: number): void {
  if (typeof window === 'undefined') return;
  
  try {
    window.localStorage.setItem(`${STORAGE_KEY}:${address}`, timestamp.toString());
  } catch {
    // Ignore storage errors
  }
}

/**
 * Calculates remaining cooldown time in seconds
 */
function getCooldownRemaining(address: string): number {
  const lastRequest = getLastRequestTime(address);
  if (!lastRequest) return 0;
  
  const elapsed = Date.now() - lastRequest;
  const remaining = COOLDOWN_MS - elapsed;
  
  return remaining > 0 ? Math.ceil(remaining / 1000) : 0;
}

/**
 * Formats seconds into MM:SS format
 */
function formatCooldown(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

export function Faucet({ address, onSuccess, onError }: FaucetProps) {
  const { getExplorerUrl } = useChain();
  const [isLoading, setIsLoading] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(() => getCooldownRemaining(address));
  const [lastTxHashes, setLastTxHashes] = useState<string[]>([]);

  // Update cooldown timer every second
  useEffect(() => {
    if (cooldownSeconds <= 0) return;

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
      } else {
        throw new Error(result.error || 'Unknown error');
      }
    } catch (error) {
      let errorMessage = 'Failed to request faucet';
      let notificationTitle = 'Faucet Failed';
      let autoClose: number | false = 5000;

      // Handle FaucetError with specific types
      if (error && typeof error === 'object' && 'type' in error) {
        const faucetError = error as FaucetError;
        errorMessage = faucetError.message;

        switch (faucetError.type) {
          case 'rate_limit':
            notificationTitle = 'Rate Limit Exceeded';
            autoClose = false; // Don't auto-close rate limit errors
            if (faucetError.cooldownSeconds) {
              // Sync cooldown with server
              setCooldownSeconds(faucetError.cooldownSeconds);
              setLastRequestTime(address, Date.now() - (COOLDOWN_MS - faucetError.cooldownSeconds * 1000));
            }
            break;
          
          case 'validation':
            notificationTitle = 'Invalid Request';
            break;
          
          case 'network':
            notificationTitle = 'Connection Error';
            autoClose = 7000; // Give more time to read network errors
            break;
          
          case 'server':
            notificationTitle = 'Service Error';
            autoClose = 7000;
            break;
          
          case 'unknown':
          default:
            notificationTitle = 'Faucet Failed';
            break;
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      
      notifications.show({
        title: notificationTitle,
        message: errorMessage,
        color: 'red',
        autoClose,
      });

      onError?.(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, [address, onSuccess, onError]);

  const isDisabled = isLoading || cooldownSeconds > 0;

  return (
    <Stack gap="xs">
      <Button
        variant="light"
        color="blue"
        fullWidth
        leftSection={<IconDroplet size={16} />}
        onClick={handleRequest}
        loading={isLoading}
        disabled={isDisabled}
      >
        {cooldownSeconds > 0 
          ? `Wait ${formatCooldown(cooldownSeconds)}` 
          : 'Request Faucet'}
      </Button>

      {lastTxHashes.length > 0 && (
        <Stack gap={4}>
          <Text size="xs" c="dimmed">
            Recent transactions:
          </Text>
          {lastTxHashes.map((hash) => {
            const explorerUrl = getExplorerUrl('tx', hash);
            return (
              <Group key={hash} gap={4} wrap="nowrap">
                <Text size="xs" style={{ fontFamily: 'monospace' }}>
                  {hash.slice(0, 10)}...{hash.slice(-8)}
                </Text>
                {explorerUrl && (
                  <Anchor
                    href={explorerUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    size="xs"
                  >
                    <IconExternalLink size={12} />
                  </Anchor>
                )}
              </Group>
            );
          })}
        </Stack>
      )}
    </Stack>
  );
}
