import type { Request, Response } from "express";
import { pool } from "../config/db.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import asyncHandler from "../utils/asyncHandler.js";
import logger from "../utils/logger.js";

const healthCheck = asyncHandler(async(req:Request,res:Response)=>{
    try {
        await pool.query("SELECT NOW()")
    } catch (error:any) {
        logger.error("Health Check DB Failure Details:", error)
        throw new ApiError(500,"Something went wrong while connecting to DB.",error.message)
    } 

    return res.status(200).json(
        new ApiResponse(200 , {status: "OK"}, "App running Smoothly.")
    )
})

export {healthCheck}