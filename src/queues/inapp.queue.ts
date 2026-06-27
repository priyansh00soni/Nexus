import { Queue } from 'bullmq';
import { bullmqConnection } from '../config/bullmq.config.js';
export const inappQueue = new Queue('inapp-queue',{connection:bullmqConnection})