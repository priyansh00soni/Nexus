import type { NextFunction, Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import crypto from 'crypto'
import { redis } from "../config/redis.js";
import { prisma } from "../config/prismaClient.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import logger from "../utils/logger.js";

const idempotencyMid = asyncHandler(async(req:Request,res:Response,next:NextFunction)=>{
    const idempotencyKey = req.headers['idempotency-key'] as string
    if(!idempotencyKey) throw new ApiError(400,"Idempotency Key Required.")

    const incomingReqHash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex')

    const redisKey = `idempotency:${req.tenant.id}:${idempotencyKey}`

    //save in redis only if its the first request => NX helps us do that. else Redis returns null and we treat it as a duplicate.
    const isFirstRequest = await redis.set(redisKey, JSON.stringify({requestHash:incomingReqHash, status:"PROCESSING"}), 'EX', 86400, 'NX')

    if(!isFirstRequest){
        const existingRequest = await redis.get(redisKey)
        if(existingRequest){
            const { requestHash, status, responseBody } = JSON.parse(existingRequest)

            if(requestHash!== incomingReqHash) throw new ApiError(409,"Please use different idempotency key.")

            if(responseBody) return res.status(200).json(responseBody)

            if(status==="PROCESSING") return res.status(409).json(new ApiResponse(409,"Request is already being processed"))
        }
    }

    //Add to DB. no await used in order to reduce req latency.
    prisma.idempotencyRecord.create({
        data:{
            request_hash:incomingReqHash,
            status:"PROCESSING",
            tenant_id:req.tenant.id,
            idempotency_key:idempotencyKey
        }
    }).catch(err => logger.error("Idempotency DB insert failed", {error:err.message, correlationId: req.correlationId }))

    const originalJson = res.json.bind(res)

    res.json = (data:any) =>{
        redis.set(
            redisKey,
            JSON.stringify({requestHash:incomingReqHash, status:"COMPLETED", responseBody:data}),
            'EX',86400
        ).catch(err => logger.error("Redis cache failed", {error:err.message, correlationId: req.correlationId }))

        prisma.idempotencyRecord.update({
            where:{idempotency_key_tenant_id:{idempotency_key:idempotencyKey, tenant_id:req.tenant.id}},
            data:{status:"COMPLETED", response_body:data}
        }).catch(err => logger.error("DB update failed", { error: err.message, correlationId: req.correlationId  }))

        return originalJson(data)
    }

    next()
})

export default idempotencyMid
