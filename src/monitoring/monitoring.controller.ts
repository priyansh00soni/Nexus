import type { Request, Response } from "express";
import { pool } from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import logger from "../utils/logger.js";
import { redis } from "../config/redis.js";
import register, { queueDepth } from "./metrics.js";
import { emailQueue } from "../queues/email.queue.js";
import { inappQueue } from "../queues/inapp.queue.js";
import { webhookQueue } from "../queues/webhook.queue.js";

const healthCheck = asyncHandler(async(req:Request,res:Response)=>{
    try {
        await pool.query("SELECT NOW()")
    } catch (error:any) {
        logger.error("Health Check DB Failure Details:", error)
        throw new ApiError(500,"Something went wrong while connecting to DB.",error.message)
    } 

    try {
        await redis.ping()
    } catch (error:any) {
        logger.error("Health Check Redis Failure Details:",error)
        throw new ApiError(500,"Something went wrong while connecting to Redis.",error.message)
    }


    try {
    await Promise.all([
        emailQueue.getJobCounts(),
        inappQueue.getJobCounts(),
        webhookQueue.getJobCounts(),
    ])
    } catch (error: any) {
        logger.error("Health Check Queue Failure Details:", error)
        throw new ApiError(500, "Something went wrong while connecting to queues.", error.message)
    }
    return res.status(200).json(
        new ApiResponse(200 , {status: "OK"}, "App running Smoothly.")
    )
})

const setMetrics = asyncHandler( async(req:Request,res:Response)=>{

    const [emailCount, inappCount, webhookCount] = await Promise.all([
        emailQueue.getJobCounts(),
        inappQueue.getJobCounts(),
        webhookQueue.getJobCounts(),
    ])

    queueDepth.set({queue_name:"email"}, Number(emailCount.waiting) )
    queueDepth.set({queue_name:"inapp"}, Number(inappCount.waiting) )
    queueDepth.set({queue_name:"webhook"}, Number(webhookCount.waiting) )

    res.set('Content-Type',register.contentType)
    res.send(await register.metrics())
})

const getDLQ = asyncHandler(async(req:Request,res:Response)=>{
    const emailDLQ = await emailQueue.getFailed()
    const inappDLQ=await inappQueue.getFailed()
    const webhookDLQ=await webhookQueue.getFailed()
     return res.status(200).json(new ApiResponse(200,{emailDLQ,inappDLQ, webhookDLQ},"DLQ fetched Successfully")) 
})

export {healthCheck,setMetrics, getDLQ}
