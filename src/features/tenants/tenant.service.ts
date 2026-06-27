import { prisma } from "../../config/PrismaClient.js";
import ApiError from "../../utils/ApiError.js";
import generateApiKey from "../../utils/generateApiKey.js";
import hashApiKey from "../../utils/hashApiKey.js";

const createTenant = async(name: string, from_email:string)=>{
    const rawKey = generateApiKey()
    const hashedKey= hashApiKey(rawKey)
    
    const result = await prisma.$transaction(async(tx)=>{
        const tenant = await tx.tenant.create({
            data:{
                name,
                from_email
            }
        })

        const apiKey = await tx.apiKey.create({
            data:{
                key_hash: hashedKey,
                tenant_id:tenant.id
            }
        })
        return {tenant, apiKey}
    })


    return {rawKey, tenant:result.tenant} 
}

export default createTenant