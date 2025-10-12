import Fastify from 'fastify';
import cors from '@fastify/cors';
import rateLimit from '@fastify/rate-limit';
import dotenv from 'dotenv';
import path from 'node:path';
import fs from 'node:fs';

import { registerRoutes } from './router';

const envPaths = [
  path.resolve(process.cwd(), '.env'),
  path.resolve(process.cwd(), '../.env'),
  path.resolve(process.cwd(), '../../.env'),
];

for (const envPath of envPaths) {
  if (fs.existsSync(envPath)) {
    dotenv.config({ path: envPath, override: false });
  }
}

const PORT = Number(process.env.PORT ?? 4000);

async function main() {
  const app = Fastify({
    logger: true,
  });

  await app.register(cors, { origin: true });
  await app.register(rateLimit, { max: 300, timeWindow: '1 minute' });

  await app.register(registerRoutes, { prefix: '/api' });

  try {
    await app.listen({ port: PORT, host: '0.0.0.0' });
    app.log.info(`API listening on port ${PORT}`);
  } catch (error) {
    app.log.error(error, 'Failed to start API');
    process.exit(1);
  }
}

main();
