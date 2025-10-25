import { z } from 'zod';

export const ChainIdSchema = z.enum(['sepolia', 'arbitrum-sepolia', 'base-sepolia']);
export type ChainId = z.infer<typeof ChainIdSchema>;

export const MarketSchema = z.object({
  id: z.string(),
  slug: z.string(),
  question: z.string(),
  expiry: z.number(),
  priceFeedId: z.string(),
  targetPrice: z.number(),
  status: z.enum(['draft', 'open', 'settled']),
});
export type Market = z.infer<typeof MarketSchema>;

export const BetSchema = z.object({
  id: z.string(),
  marketId: z.string(),
  side: z.enum(['yes', 'no']),
  amount: z.string(),
  userId: z.string(),
  createdAt: z.date(),
});
export type Bet = z.infer<typeof BetSchema>;

export const ConfigSchema = z.object({
  paypalClientId: z.string(),
  pythEndpoint: z.string().url(),
  targetChain: ChainIdSchema,
});
export type AppConfig = z.infer<typeof ConfigSchema>;

export const DEFAULT_SETTLEMENT_BUFFER_SECONDS = 300;

// Faucet types
export interface FaucetResponse {
  ok: boolean;
  transactions?: string[];
  error?: string;
}

// Config response types
export interface ConfigResponse {
  paypalClientId: string;
  pythEndpoint: string;
  targetChain: string;
  chainType: 'evm' | 'solana';
  pyusdAddress?: string;
  pyusdMint?: string;
  rpcUrl: string;
  localChainEnabled: boolean;
  faucetAvailable: boolean;
  explorerUrl?: string;
  marketAddress?: string;
}
