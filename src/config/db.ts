import { Pool } from "pg";
import logger from "../utils/logger.js";
const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.DB_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: Number(process.env.DB_PORT), 
});

const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const connectDB = async()=>{
    let attempt =1;
    while (true) {
        try {
            await pool.query("SELECT NOW()")
            logger.info("Database connected")
            break
        } catch (error) {
            if (attempt>=10) {
                logger.error(error)
                process.exit(1)
            }
            const delay = Math.min(1000*2**attempt,30000)
            logger.info(`DB connection failed, retrying in ${delay}ms`)
            await wait(delay)
            attempt++;
        }
    }
}

export {pool}
export default connectDB
