import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';

import { createRouter } from './router';

dotenv.config();

const PORT = Number(process.env.PORT ?? 4000);

async function main() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, { origin: true });
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });

  const router = createRouter();
  await app.register(router, { prefix: '/api' });

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`API listening on port ${PORT}`);
  } catch (error) {
    app.log.error(error, 'Failed to start API');
    process.exit(1);
  }
}

main();
