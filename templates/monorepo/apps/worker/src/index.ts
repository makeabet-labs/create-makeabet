import { Queue, Worker } from 'bullmq';
import dotenv from 'dotenv';
import { createLogger } from './logger';

dotenv.config();

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
