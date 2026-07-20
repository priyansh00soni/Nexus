import { type NextFunction, type Request, type Response } from "express";
import { redis } from "../config/redis.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";

const rateLimit = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
    
    //works for per tenant, uses sorted set. - sliding window rate limiting.
    const key = `rateLimit:${req.tenant.id}`
    const now =Date.now()
    const windowStart = now - 60000

    //pipeline sends all 4 commands in one round trip instead of 4 sequential ones.
    const results = await redis.pipeline()
        .zremrangebyscore(key, 0, windowStart) // delete everything older than 60 seconds ago, keeps the sorted set clean and only containing recent requests.
        .zcard(key) //zcard simply counts how many items currently exist in the sorted set
        .zadd(key,now,`${now}-${Math.random()}`)
        .expire(key, 60)//auto delete the sorted set after 60 seconds of no activity, safety cleanup so Redis doesn't keep abandoned keys forever.
        .exec()

    const leftEntriesCount = Number(results?.[1]?.[1] ?? 0)

    if(leftEntriesCount>=6000) throw new ApiError(429,"Too many requests")

    next()
})

export default rateLimit