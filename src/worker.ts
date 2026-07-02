import connectDB from "./config/db.js";
import connectRedis from "./config/redis.js";
import express, { type Request, type Response } from "express"; 
import register from "./monitoring/metrics.js";
import logger from "./utils/logger.js";

await connectDB();
await connectRedis();

await import('./workers/email.worker.js');
await import('./workers/inapp.worker.js');
await import('./workers/webhook.worker.js');

const metricsApp = express(); 

metricsApp.get('/metrics', async (req: Request, res: Response) => {
    try {
        res.set('Content-Type', register.contentType);
        res.send(await register.metrics());
    } catch (err) {
        res.status(500).send('Metrics connection failed');
    }
});

metricsApp.use((req, res) => {
  res.status(404).send('Not Found');
});

metricsApp.listen(9101, () => {
  logger.info('Worker metrics server running on port 9101');
});
