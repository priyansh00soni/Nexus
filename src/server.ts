import app from "./app.js";
import connectDB from "./config/db.js";
connectDB()
    .then(()=>{
        app.listen(process.env.APP_PORT || 8000 , ()=>{
            console.log(`App listens at port: ${process.env.APP_PORT}`);
        })
    })
.catch((err:string)=>{
    console.log("DB Connection error",err);
    process.exit(1)
})