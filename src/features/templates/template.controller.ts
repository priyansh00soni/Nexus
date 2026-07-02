import type { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import {createTemplate, deleteTemplate, getTemplate, updateTemplate} from "./template.service.js";
import ApiResponse from "../../utils/ApiResponse.js";
import ApiError from "../../utils/ApiError.js";

const createTemplateController = asyncHandler(async(req:Request, res:Response)=>{
    const {message, subject} = req.body
    const tenant_id = req.tenant?.id
    const template = await createTemplate(message,tenant_id,subject)
    return res.status(201).json(new ApiResponse(201,template,"Template created successfully"))
})

const getTemplateController = asyncHandler(async(req:Request, res:Response)=>{
    const template_id = req.params.template_id as string
    if(!template_id) throw new ApiError(400,"Please provide template id.")
    const tenant_id = req.tenant.id
    const template = await getTemplate(template_id,tenant_id)
    return res.status(200).json(new ApiResponse(200,template,"Template Fetched Successfully."))
})

const updateTemplateController = asyncHandler(async(req:Request, res:Response)=>{
    const template_id = req.params.template_id as string
    if(!template_id) throw new ApiError(400,"Please provide template id.")
    const {message,subject} = req.body
    const tenant_id = req.tenant.id
    const template = await updateTemplate(template_id,tenant_id, message,subject)
    return res.status(200).json(new ApiResponse(200,template,"Template Updated Successfully."))
})

const deleteTemplateController = asyncHandler(async(req:Request, res:Response)=>{ 
    const template_id = req.params.template_id as string
    if(!template_id) throw new ApiError(400,"Please provide template id.")
    const tenant_id = req.tenant.id
    const template = await deleteTemplate(template_id,tenant_id)
    return res.status(200).json(new ApiResponse(200,template,"Template Deleted Successfully."))
})

export {getTemplateController, createTemplateController, updateTemplateController, deleteTemplateController}