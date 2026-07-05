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

    const redisCache = await redis.get(`idempotency:${req.tenant.id}:${idempotencyKey}`)

    if(redisCache){
        const { requestHash, responseBody } = JSON.parse(redisCache)

    if(requestHash!== incomingReqHash) throw new ApiError(409,"Please use different idempotency key.")
    
    if(responseBody) return res.status(200).json(responseBody)
    }
        
    const idempotencyRecord =await prisma.idempotencyRecord.findUnique({
        where:{idempotency_key_tenant_id:{idempotency_key:idempotencyKey, tenant_id:req.tenant.id}},
    })

    if(idempotencyRecord){
        if(incomingReqHash!==idempotencyRecord.request_hash) throw new ApiError(409,"Please use different idempotency key.")

        if(idempotencyRecord.status=="PROCESSING") return res.status(409).json(new ApiResponse(409,"Request is already being processed"))
        
        if(idempotencyRecord.response_body) return res.status(200).json(idempotencyRecord.response_body)
    }

    await prisma.idempotencyRecord.create({
        data:{
            request_hash:incomingReqHash,
            status:"PROCESSING",
            tenant_id:req.tenant.id,
            idempotency_key:idempotencyKey
        }
    })

    const originalJson = res.json.bind(res)

    res.json = (data:any) =>{
        redis.set(
            `idempotency:${req.tenant.id}:${idempotencyKey}`,
            JSON.stringify({requestHash:incomingReqHash, responseBody:data}),
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