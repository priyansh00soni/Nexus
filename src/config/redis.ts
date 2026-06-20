import {Redis} from "ioredis";
import logger from "../utils/logger.js";

const redis = new Redis({
    port: Number(process.env.REDIS_PORT),
    host: process.env.REDIS_HOST,
    password: process.env.REDIS_PASSWORD,
    db:0,
})

const wait = (ms:number) => new Promise((resolve)=> setTimeout(resolve,ms))

const connectRedis =async () =>{
    let attempt = 1
    while(true){
        try {
            const reply =await redis.ping()
            logger.info(reply)
        } catch (error) {
            if(attempt>=10){
                logger.error("Max retries reached",{
                    error:error instanceof Error ? error.message : String(error)
                })
                process.exit(1)
            }
        }
        const delay = Math.min((1000*2)**attempt,30000) 
        logger.info("Redis Connection Failed.", {"delay":delay,"attempt":attempt})
        await wait(delay)
        attempt++;
    }
}


export {redis}
export default connectRedis