import app from "./app.js";
import connectDB, { pool } from "./config/db.js";
import connectRedis, { redis } from "./config/redis.js";
import logger from "./utils/logger.js";

await connectDB()
await connectRedis()

//production hosts only this API process, so workers run in-process by default. In docker compose, dedicated worker containers (worker-1/worker-2) handle jobs, so the api service sets START_WORKERS_IN_API=false to keep the event loop and DB pool free for HTTP requests.
if(process.env.START_WORKERS_IN_API !== 'false'){
    await import('./workers/email.worker.js');
    await import('./workers/inapp.worker.js');
    await import('./workers/webhook.worker.js');
}

const server = app.listen(process.env.APP_PORT || 8000 , ()=>{
    logger.info(`App listens at port: ${process.env.APP_PORT}`);
})

const shutdown = async () => {
    logger.info("Shutting Down Gracefully!")
    await new Promise((resolve) => server.close(resolve))
    await pool.end()
    await redis.quit()
    process.exit(0)
}

process.on('SIGTERM', shutdown)
process.on('SIGINT', shutdown)