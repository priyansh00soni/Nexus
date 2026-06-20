import app from "./app.js";
import connectDB from "./config/db.js";
import connectRedis from "./config/redis.js";
import logger from "./utils/logger.js";

await connectDB()
await connectRedis()

app.listen(process.env.APP_PORT || 8000 , ()=>{
    logger.info(`App listens at port: ${process.env.APP_PORT}`);
})