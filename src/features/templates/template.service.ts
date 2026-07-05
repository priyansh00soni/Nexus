import { prisma } from "../../config/prismaClient.js"
import ApiError from "../../utils/ApiError.js"

const createTemplate = async(message:string,tenant_id:string, subject?:string)=>{
    const template = await prisma.template.create({
        data:{
            message,
            tenant_id,
            ...(subject  ? {subject } : {}),
        }
    })

    return template
}

const getTemplate = async(template_id:string, tenant_id:string) =>{
    const template = await prisma.template.findFirst({
            where:{id:template_id, tenant_id}
    })
    if(!template) throw new ApiError(404,"No Template Found")
    return template
}

const updateTemplate = async(template_id:string, tenant_id:string, message?:string ,subject?: string)=>{
    const template = await prisma.template.update({
        where:{id:template_id,tenant_id},
        data:{
           ...(message ? {message} : {}),
           ...(subject ? {subject} : {})
        }
    }) 

    return template
}

const deleteTemplate = async(template_id:string, tenant_id:string)=>{
    const template  = await prisma.template.delete({
        where:{id:template_id,tenant_id}
    })
    return template
}

export {createTemplate, getTemplate, updateTemplate, deleteTemplate}