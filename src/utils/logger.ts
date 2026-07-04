import winston from "winston";
import { storage } from "./asyncStorage.js";


const logger = winston.createLogger({
    level:"info",
    format: winston.format.combine(
        winston.format(info=>{
            const store = storage.getStore()
            if(store?.correlationId) info.correlationId= store.correlationId
            return info
        })(),
        winston.format.timestamp(),  
        winston.format.json(),    
    ),
    transports: [
        new winston.transports.Console() 
    ]
})


export default logger 