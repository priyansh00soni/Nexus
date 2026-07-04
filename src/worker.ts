import connectDB from "./config/db.js";
import connectRedis from "./config/redis.js";
import express from "express"; 
import type { Request, Response } from "express";
import register from "./monitoring/metrics.js";
import logger from "./utils/logger.js";

await connectDB();
await connectRedis();

await import('./workers/email.worker.js');
await import('./workers/inapp.worker.js');
await import('./workers/webhook.worker.js');

const app = express(); 

app.get('/metrics',async(req:Request,res:Response)=>{
  res.set("Content-Type", register.contentType);
  res.send(await register.metrics());
})

app.listen(9101,()=>{
  logger.info(`Worker ${process.env.WORKER_ID} running`)
})