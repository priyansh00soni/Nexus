import { Pool } from "pg";

const pool = new Pool({
  user: process.env.POSTGRES_USER,
  host: process.env.DB_HOST,
  database: process.env.POSTGRES_DB,
  password: process.env.POSTGRES_PASSWORD,
  port: Number(process.env.DB_PORT), 
});

const connectDB = async()=>{
    try {


        await setTimeout(()=>{pool.query('SELECT NOW()')},2000)

        console.log("Database connected");
    } catch (error) {
        console.error(error)
        process.exit(1)
    }
}

export default connectDB