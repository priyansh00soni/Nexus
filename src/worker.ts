import connectDB from "./config/db.js";
import connectRedis from "./config/redis.js";

await connectDB();
await connectRedis();

await import('./workers/email.worker.js');
await import('./workers/inapp.worker.js');
await import('./workers/webhook.worker.js');



