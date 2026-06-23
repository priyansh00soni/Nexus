import crypto from 'crypto'
const generateApiKey = ()=>{
    const key = crypto.randomBytes(32).toString('hex')
    return key
}

export default generateApiKey