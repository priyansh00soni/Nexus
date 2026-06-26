import type { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import {createTemplate, getTemplate} from "./template.service.js";
import ApiResponse from "../../utils/ApiResponse.js";

const createTemplateController = asyncHandler(async(req:Request, res:Response)=>{
    const {message, channel} = req.body
    const tenant_id = req.tenant?.id
    const template = await createTemplate(message,channel,tenant_id)
    return res.status(201).json(new ApiResponse(201,template,"Template created successfully"))
})

const getTemplateController = asyncHandler(async(req:Request, res:Response)=>{
    const template_id = req.params.template_id as string
    const tenant_id = req.tenant.id
    const template = await getTemplate(template_id,tenant_id)
    return res.status(200).json(new ApiResponse(200,template,"Template Fetched Successfully."))
})


export {getTemplateController, createTemplateController}