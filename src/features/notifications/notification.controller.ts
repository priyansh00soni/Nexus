import type { Request, Response } from "express";
import asyncHandler from "../../utils/asyncHandler.js";
import { createNotification } from "./notification.service.js";
import ApiResponse from "../../utils/ApiResponse.js";

const createNotificationController  = asyncHandler(async(req:Request, res:Response)=>{
    const {message, template_id, recipient, channel, variables, subject,scheduledFor} = req.body
    const tenant_id= req.tenant.id
    const notification = await createNotification(tenant_id, recipient, channel, template_id, message, variables, subject, scheduledFor)
    return res.status(201).json(new ApiResponse(201,notification,"Notification created Successfully."))
})

export {createNotificationController}