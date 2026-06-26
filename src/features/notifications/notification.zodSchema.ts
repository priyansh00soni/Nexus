import { z } from 'zod'
import { Channel } from '../../generated/prisma/enums.js'

const rawSchema = z.object({
    message: z.string(),
    channel: z.enum([Channel.EMAIL, Channel.INAPP, Channel.WEBHOOK]),
    recipient:z.string()
})

const templateSchema = z.object({
    
})


export const createNotificationSchema = z.object({
    channel: z.enum([Channel.EMAIL, Channel.INAPP, Channel.WEBHOOK]),
    message: z.string().min(1, "Message cannot be empty")
})

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>