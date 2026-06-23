import crypto from 'crypto'
const hashApiKey = (rawKey:string)=>{
    const hash = crypto.createHash('sha256').update(rawKey).digest('hex')
    return hash
}

export default hashApiKey