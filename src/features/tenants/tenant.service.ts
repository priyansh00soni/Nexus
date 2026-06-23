import generateApiKey from "../../utils/generateApiKey.js";
import { prisma } from "../../config/prismaClient.js";
import hashApiKey from "../../utils/hashApiKey.js";

const createTenant = async(name: string)=>{
    const rawKey = generateApiKey()
    const hashedKey= hashApiKey(rawKey)
    
    const result = await prisma.$transaction(async(tx)=>{
        const tenant = await tx.tenant.create({
            data:{name}
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