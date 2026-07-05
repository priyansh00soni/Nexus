import { prisma } from "../../config/prismaClient.js"
import { emailQueue } from "../../queues/email.queue.js"
import { inappQueue } from "../../queues/inapp.queue.js"
import { webhookQueue } from "../../queues/webhook.queue.js"
import ApiError from "../../utils/ApiError.js"

const createNotification = async(tenant_id:string, recipient:string,channel: ("WEBHOOK" | "INAPP" | "EMAIL"), template_id?:string,message?:string, variables?: Record<string, unknown>, subject? : string ,scheduledFor?:Date,correlationId?:string)=>{


    const notification = await prisma.notification.create({
        data:{
            tenant_id,
            recipient,
            channel,
            ...(message ? {message} : {}),
            ...(subject  ? {subject } : {}),
            ...(variables ? {variables: variables as any} : {}),
            ...(template_id ? {template_id} : {}),
            ...(scheduledFor ? {scheduledFor} : {}),
            status: scheduledFor? "SCHEDULED" : "PROCESSING",
            attempts:0,
        }
    })

    const delay = scheduledFor ? Math.max(0, scheduledFor.getTime() - Date.now()) : 0

    const queueMap = {
        EMAIL: emailQueue,
        INAPP: inappQueue,
        WEBHOOK: webhookQueue
    }

    await queueMap[channel].add(`send-${channel.toLowerCase()}` ,{ notification_id: notification.id, tenant_id,correlationId },{
    delay,
    attempts: 3,
    backoff: {
        type: 'custom',
    }
})

    return notification
}

const getNotificationStatus = async(notification_id:string,tenant_id:string)=>{

    const status = await prisma.notification.findFirst({
        where:{id:notification_id, tenant_id:tenant_id},
        include: { delivery_attempts: true }
    })

    if(!status) throw new ApiError(404, "Notification not found")

    return status
}

const getNotifications = async(tenant_id:string,page:number,limit:number,sortType:'asc' | 'desc',sortBy:string,status?:("PROCESSING"|"FAILED"|"COMPLETED"),channel?: ("WEBHOOK" | "INAPP" | "EMAIL"),from?:Date,to?:Date)=>{

    const notifications = await prisma.notification.findMany({
        where:{tenant_id:tenant_id,
            ...(status ? {status} : {}),
            ...(channel ? {channel} : {}),
            ...(from ? { created_at: { gte: from } } : {}),
            ...(to ? { created_at: { lte: to } } : {}),
        },
        include:{delivery_attempts:true},
        orderBy:{[sortBy]:sortType},
        skip:limit*(page-1),
        take:limit,
    })

    return notifications

}

export {createNotification, getNotificationStatus,getNotifications}