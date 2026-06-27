import { Worker } from 'bullmq';
import { bullmqConnection } from '../config/bullmq.config.js';
import logger from '../utils/logger.js';

const worker = new Worker(
  'email-queue',
  async job => {
    logger.info(job)
  },
  { connection: bullmqConnection },
);

worker.on('completed', job => {
  logger.info(`${job.id} has completed!`);
});

worker.on('failed', (job, err) => {
  logger.info(`${job?.id} has failed with ${err.message}`);
});