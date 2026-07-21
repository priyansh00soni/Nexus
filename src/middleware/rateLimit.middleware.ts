import { type NextFunction, type Request, type Response } from "express";
import { redis } from "../config/redis.js";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";


const rateLimit = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{

    //works for per tenant, uses sorted set. - sliding window rate limiting.
    const key = `rateLimit:${req.tenant.id}`
    const now =Date.now()
    const windowStart = now - 60000
    const member = `${now}-${Math.random()}`

    //single pipeline: cleanup, add optimistically, count, set TTL — one round trip for the happy path.
    const results = await redis.pipeline()
        .zremrangebyscore(key, 0, windowStart) // delete everything older than 60 seconds ago, keeps the sorted set clean and only containing recent requests.
        .zadd(key, now, member) // add optimistically before checking count
        .zcard(key) //zcard counts after add, so includes the current request
        .expire(key, 60)//auto delete the sorted set after 60 seconds of no activity, safety cleanup so Redis doesn't keep abandoned keys forever.
        .exec()

    const currentCount = Number(results?.[2]?.[1] ?? 0)

    //rejected requests shouldn't extend the block — roll back the optimistic add.
    if(currentCount > 20000){
        await redis.zrem(key, member)
        throw new ApiError(429,"Too many requests")
    }

    next()
})

export default rateLimit