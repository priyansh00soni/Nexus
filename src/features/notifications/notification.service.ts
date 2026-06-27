import { prisma } from "../../config/PrismaClient.js"
import ApiError from "../../utils/ApiError.js"

const createNotification = async(tenant_id:string, recipient:string, template_id?:string, channel?: ("WEBHOOK" | "INAPP" | "EMAIL"),message?:string)=>{
    const notification = await prisma.notification.create({
        data:{
            tenant_id,
            recipient,
            ...(message ? {message} : {}),
            ...(channel ? {channel} : {}),
            ...(template_id ? {template_id} : {}),
            status:"PROCESSING",
            attempts:0,
        }
    })
    return notification
}

export {createNotification}