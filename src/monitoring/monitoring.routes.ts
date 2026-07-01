import { Router, type Request, type Response } from "express";
import { healthCheck } from "./monitoring.controller.js";
import register, { queueDepth } from "./metrics.js";
import asyncHandler from "../utils/asyncHandler.js";
import { emailQueue } from "../queues/email.queue.js";
import { inappQueue } from "../queues/inapp.queue.js";
import { webhookQueue } from "../queues/webhook.queue.js";

const router = Router()

router.route('/').get(healthCheck)

router.route('/metrics').get(asyncHandler( async(req:Request,res:Response)=>{

    const [emailCount, inappCount, webhookCount] = await Promise.all([
        emailQueue.getJobCounts(),
        inappQueue.getJobCounts(),
        webhookQueue.getJobCounts(),
    ])

    queueDepth.set({queue_name:"email"}, Number(emailCount.waiting) )
    queueDepth.set({queue_name:"inapp"}, Number(inappCount.waiting) )
    queueDepth.set({queue_name:"webhook"}, Number(webhookCount.waiting) )

    res.set('Content-Type',register.contentType)
    res.send(await register.metrics())
}))


export default router