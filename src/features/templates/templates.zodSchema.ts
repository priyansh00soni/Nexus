import { z } from 'zod'
import { Channel } from '../../generated/prisma/enums.js'

export const createTemplateSchema = z.object({
    channel: z.enum([Channel.EMAIL, Channel.INAPP, Channel.WEBHOOK]),
    message: z.string().min(1, "Message cannot be empty")
})

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>