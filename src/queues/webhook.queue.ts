import { Queue } from 'bullmq';
import { bullmqConnection } from '../config/bullmq.config.js';
export const webhookQueue = new Queue('webhook-queue',{connection:bullmqConnection})