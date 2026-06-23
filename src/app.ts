import type { Express, NextFunction, Request, Response } from "express";
import express from "express";
import cors from 'cors'
import cookieParser from "cookie-parser";
import ApiResponse from "./utils/ApiResponse.js";
import ApiError from "./utils/ApiError.js";
const app:Express = express()

app.use(
    cors({
        origin:process.env.CORS_ORIGIN,
        credentials:true
    })
)

app.use(express.json({limit: '16kb'}))

app.use(express.urlencoded({ extended:true, limit:'16kb'}))

app.use(express.static('public'))

app.use(cookieParser())

//Routes

import HealthRouter from './monitoring/monitoring.routes.js'
import TenantRouter from './features/tenants/tenant.routes.js'


app.use('/api/v1/health',HealthRouter)
app.use('/api/v1/tenant',TenantRouter)



app.use((err:ApiError | Error,req:Request,res:Response,next:NextFunction)=>{
    const statusCode = err instanceof ApiError ? err.statusCode : 500
    return res.status(statusCode || 500).json(
        new ApiResponse(statusCode || 500,err.message||"Something went wrong")
    )
})

export default app
