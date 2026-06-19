import app from "./app.js";
import connectDB from "./config/db.js";
import logger from "./utils/logger.js";
connectDB()
    .then(()=>{
        app.listen(process.env.APP_PORT || 8000 , ()=>{
            logger.info(`App listens at port: ${process.env.APP_PORT}`);
        })
    })
.catch((err:string)=>{
    logger.info("DB Connection error",err);
    process.exit(1)
})