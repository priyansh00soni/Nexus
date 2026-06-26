import { prisma } from "../../config/PrismaClient.js"
import ApiError from "../../utils/ApiError.js"

const createTemplate = async(message:string, channel: ("WEBHOOK" | "INAPP" | "EMAIL"), tenant_id:string)=>{
    const template = await prisma.template.create({
        data:{
            message,
            channel,
            tenant_id
        }
    })

    if(!template) throw new ApiError(500,"Something went wrong while creating tenant")

    return template
}

const getTemplate = async(template_id:string, tenant_id:string) =>{
    const template = await prisma.template.findFirst({
            where:{id:template_id, tenant_id}
    })
    if(!template) throw new ApiError(404,"No Template Found")
    return template
}

const updateTemplate = async(template_id:string, tenant_id:string, message?:string , channel?: ("WEBHOOK" | "INAPP" | "EMAIL"))=>{
    const template = await prisma.template.update({
        where:{id:template_id,tenant_id},
        data:{
           ...(message ? {message} : {}),
           ...(channel ? {channel} : {})
        }
    }) 

    return template
}

export {createTemplate, getTemplate, updateTemplate}