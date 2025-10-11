import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import fp from 'fastify-plugin';

export function createRouter() {
  return fp(async (app: FastifyInstance, _opts: FastifyPluginOptions) => {
    app.get('/health', async () => ({ status: 'ok' }));

    app.get('/config', async () => ({
      paypalClientId: process.env.PAYPAL_CLIENT_ID ?? '',
      pythEndpoint: process.env.PYTH_PRICE_SERVICE_URL ?? '',
      targetChain: process.env.TARGET_CHAIN ?? 'sepolia',
    }));
  });
}
