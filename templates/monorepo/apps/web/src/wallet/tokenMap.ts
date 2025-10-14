export const PYUSD_DECIMALS = Number(import.meta.env.VITE_PYUSD_DECIMALS ?? 6);

export const PYUSD_TOKEN_ADDRESSES: Record<number, `0x${string}` | undefined> = {
  11155111: import.meta.env.VITE_PYUSD_TOKEN_ADDRESS_SEPOLIA,
  421614: import.meta.env.VITE_PYUSD_TOKEN_ADDRESS_ARBITRUM_SEPOLIA,
};
