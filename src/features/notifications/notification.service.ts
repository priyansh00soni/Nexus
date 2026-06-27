import { prisma } from "../../config/PrismaClient.js"
import ApiError from "../../utils/ApiError.js"

const createNotification = async(tenant_id:string, recipient:string,channel: ("WEBHOOK" | "INAPP" | "EMAIL"), template_id?:string,message?:string)=>{
    const notification = await prisma.notification.create({
        data:{
            tenant_id,
            recipient,
            channel,
            ...(message ? {message} : {}),
            ...(template_id ? {template_id} : {}),
            status:"PROCESSING",
            attempts:0,
        }
    })
    return notification
}

export {createNotification}