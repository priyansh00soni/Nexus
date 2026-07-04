import type { NextFunction, Request, Response } from "express";
import { storage } from "../utils/asyncStorage.js";

export const correlationID  = (async(req:Request, res:Response, next:NextFunction)=>{
    const id = crypto.randomUUID()
    req.correlationId = id
    storage.run({ correlationId: id }, next);
})

