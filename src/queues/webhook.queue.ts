import { Queue } from 'bullmq';
export const webhookQueue = new Queue('webhook-queue',)