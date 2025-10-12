import { Queue, Worker } from 'bullmq';
import dotenv from 'dotenv';
import fs from 'node:fs';
import path from 'node:path';
import { createLogger } from './logger';

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

const logger = createLogger('worker');

const connection = {
  connection: {
    host: process.env.REDIS_HOST ?? '127.0.0.1',
    port: Number(process.env.REDIS_PORT ?? 6379),
    password: process.env.REDIS_PASSWORD ?? 'makeabet',
  },
};

const settlementQueue = new Queue('settlement', connection);

new Worker(
  'settlement',
  async (job) => {
    logger.info({ jobId: job.id }, 'Processing settlement job');
    // TODO: call contracts to settle market using Pyth data
  },
  connection
).on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Settlement job failed');
});

async function bootstrap() {
  await settlementQueue.add('warmup', {});
  logger.info('Worker up and running');
}

bootstrap().catch((error) => {
  logger.error({ error }, 'Worker failed to start');
  process.exit(1);
});
