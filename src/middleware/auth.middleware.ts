import type { NextFunction, Request } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import { prisma } from "../config/PrismaClient.js";
import hashApiKey from "../utils/hashApiKey.js";

const authMid = asyncHandler(async(req:Request,next:NextFunction)=>{
    const apiKey = req.headers['x-api-key'] as string
    if(!apiKey) throw new ApiError(400,"Api key not provided.")

    const key_hash = hashApiKey(apiKey)

    const tenant = await prisma.apiKey.findUnique({
        where:{key_hash}
    })

    if(!tenant) throw new ApiError(404,"Client Not Registered. Please Register.")

    req.tenant =tenant
    next()
})

export default authMid