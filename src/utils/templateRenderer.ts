export const templateRenderer = (templateMessage:string, variables:Record<string, unknown>)=>{
    const result = templateMessage.replace(/{{(.*?)}}/g, (_,key)=> String(variables[key.trim()] ?? _))
    return result
}
