import { prisma } from "../../config/PrismaClient.js"
import { emailQueue } from "../../queues/email.queue.js"
import { inappQueue } from "../../queues/inapp.queue.js"
import { webhookQueue } from "../../queues/webhook.queue.js"

const createNotification = async(tenant_id:string, recipient:string,channel: ("WEBHOOK" | "INAPP" | "EMAIL"), template_id?:string,message?:string, variables?: Record<string, unknown>, subject? : string )=>{
    const notification = await prisma.notification.create({
        data:{
            tenant_id,
            recipient,
            channel,
            ...(message ? {message} : {}),
            ...(subject  ? {subject } : {}),
            ...(variables ? {variables: variables as any} : {}),
            ...(template_id ? {template_id} : {}),
            status:"PROCESSING",
            attempts:0,
        }
    })

    const queueMap = {
        EMAIL: emailQueue,
        INAPP: inappQueue,
        WEBHOOK: webhookQueue
    }

    await queueMap[channel].add(`send-${channel.toLowerCase()}`, { notification_id: notification.id })

    return notification
}

export {createNotification}