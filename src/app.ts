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

import MonitoringRouter from './monitoring/monitoring.routes.js'
import TenantRouter from './features/tenants/tenant.routes.js'
import TemplateRouter from './features/templates/template.routes.js'
import NotificationRouter from './features/notifications/notification.routes.js'


app.use('/api/v1/monitoring',MonitoringRouter)
app.use('/api/v1/tenant',TenantRouter)
app.use('/api/v1/template',TemplateRouter)
app.use('/api/v1/notification',NotificationRouter)


import { Prisma } from "./generated/prisma/client.js";

app.use((err:ApiError | Error,req:Request,res:Response,next:NextFunction)=>{

    if(err instanceof Prisma.PrismaClientKnownRequestError){
        if(err.code === 'P2002') return res.status(409).json({ success: false, message: "Resource already exists." })
        if(err.code === 'P2025') return res.status(404).json({ success: false, message: "Resource Not Found." })
    }

    const statusCode = err instanceof ApiError ? err.statusCode : 500
    return res.status(statusCode).json({ success: false, message: err.message || "Something went wrong" })
})

export default app
