import { prisma } from "../config/prismaClient.js"
import ApiError from "./ApiError.js"
import { templateRenderer } from "./templateRenderer.js"

export const resolveNotificationMessage = async(notification_id:string)=>{
    const notification = await prisma.notification.findUnique({
      where:{id:notification_id}
    })

    if(!notification) throw new ApiError(404, "Notification not found")

    let messageString 
    let subjectString

    if(notification.template_id){
      const template = await prisma.template.findUnique({
        where:{id:notification.template_id},
      })

      if(!template) throw new ApiError(404, "Template not found")

      messageString = templateRenderer(template.message,notification.variables as Record<string, unknown>)

      subjectString = template.subject
    }

    else{
      if(!notification.message) throw new ApiError(404, "Message not found")
      messageString = templateRenderer(notification.message,notification.variables as Record<string, unknown>)
      subjectString = notification.subject
    }

    if(!messageString) throw new ApiError(400, "Message could not be resolved")
    
    return{subjectString, messageString,notification}
}

