import type { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import ApiError from "../../utils/ApiError.js";
import createTenant from "./tenant.service.js";
import ApiResponse from "../../utils/ApiResponse.js";

const createTenantController = asyncHandler(async(req: Request, res: Response)=>{
    const {name} = req.body 
    if(!name) throw new ApiError(400,"Please Enter the name")
    const {tenant, rawKey} = await createTenant(name)
    return res.status(201).json(new ApiResponse(201,{tenant,rawKey}, "Tenant Created Successfully"))
})

export default createTenantController