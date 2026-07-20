import { type NextFunction, type Request, type Response } from "express";
import { redis } from "../config/redis.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const rateLimit = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
    
    //works for per tenant, uses sorted set. - sliding window rate limiting.
    const key = `rateLimit:${req.tenant.id}`
    const now =Date.now()
    const windowStart = now - 60000

    await redis.zremrangebyscore(key, 0, windowStart) // This deletes every entry in the sorted set whose score, which is the timestamp, is between 0 and windowStart. In simple words, delete everything older than 60 seconds ago. This keeps the sorted set clean and only containing recent requests.

    const leftEntriesCount = await redis.zcard(key) //zcard simply counts how many items currently exist in the sorted set

    if(leftEntriesCount>=6000) throw new ApiError(429,"Too many requests")
    
    await redis.zadd(key,now,`${now}-${Math.random()}`)

    await redis.expire(key, 60)//This sets the sorted set itself to automatically delete after 60 seconds of no activity, just as a safety cleanup so Redis doesn't keep empty or abandoned keys forever for tenants who stop sending requests.
    next()
})

export default rateLimit