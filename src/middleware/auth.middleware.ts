import type { NextFunction, Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { prisma } from "../config/prismaClient.js";
import hashApiKey from "../utils/hashApiKey.js";
import { redis } from "../config/redis.js";

const authMid = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
    const apiKey = req.headers['x-api-key'] as string
    if(!apiKey) throw new ApiError(400,"Api key not provided.")

    const key_hash = hashApiKey(apiKey)

    //cache the tenant in redis so every request doesn't hit the DB.
    const cachedTenant = await redis.get(`apiKey:${key_hash}`)
    if(cachedTenant){
        req.tenant = JSON.parse(cachedTenant)
        return next()
    }

    const apiKeyRecord = await prisma.apiKey.findUnique({
        where:{key_hash},
        include: { tenant: true }
    })

    if(!apiKeyRecord) throw new ApiError(404,"Client Not Registered. Please Register.")

    await redis.set(`apiKey:${key_hash}`, JSON.stringify(apiKeyRecord.tenant), 'EX', 300)

    req.tenant= apiKeyRecord.tenant
    next()
})

export default authMid