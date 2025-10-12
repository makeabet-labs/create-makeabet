import { FastifyInstance } from 'fastify';

type ChainType = 'evm' | 'solana';

export async function registerRoutes(app: FastifyInstance) {
  app.get('/health', async () => ({ status: 'ok' }));

  app.get('/config', async () => {
    const chainType = (process.env.CHAIN_TYPE ?? 'evm') as ChainType;
    return {
      paypalClientId: process.env.PAYPAL_CLIENT_ID ?? '',
      pythEndpoint: process.env.PYTH_PRICE_SERVICE_URL ?? '',
      targetChain: process.env.TARGET_CHAIN ?? 'sepolia',
      chainType,
      pyusdAddress: chainType === 'evm' ? process.env.PYUSD_CONTRACT_ADDRESS ?? '' : undefined,
      pyusdMint: chainType === 'solana' ? process.env.PYUSD_MINT_ADDRESS ?? '' : undefined,
      rpcUrl:
        chainType === 'evm'
          ? process.env.EVM_RPC_URL ?? ''
          : process.env.SOLANA_RPC_URL ?? '',
    };
  });
}
