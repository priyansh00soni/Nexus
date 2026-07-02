import type { NextFunction, Request, Response } from "express";
import asyncHandler from "../utils/asyncHandler.js";
import { type ZodSchema } from "zod";
import ApiError from "../utils/ApiError.js";

const validate = (schema: ZodSchema) => asyncHandler(async(req:Request,res:Response, next:NextFunction) =>{
    const result = schema.safeParse({...req.body, ...req.params})
    if(!result.success) throw new ApiError(400, "Validation failed", result.error.flatten().fieldErrors)
    req.body = result.data
    next()
})

export default validate