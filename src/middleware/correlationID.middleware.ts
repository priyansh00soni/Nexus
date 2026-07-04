import type { NextFunction, Request, Response } from "express";

export const correlationID  = (async(req:Request, res:Response, next:NextFunction)=>{
    const id = crypto.randomUUID()
    req.correlationId = id
})

