import { z } from 'zod'
import { Channel } from '../../generated/prisma/enums.js'

export const createTemplateSchema = z.object({
    channel: z.enum([Channel.EMAIL, Channel.INAPP, Channel.WEBHOOK]),
    message: z.string().min(1, "Message cannot be empty")
})

export const updateTemplateSchema = z.object({
    channel: z.enum([Channel.EMAIL, Channel.INAPP, Channel.WEBHOOK]).optional(),
    message: z.string().min(1, "Message cannot be empty").optional()
})

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
export type updateTemplateInput = z.infer<typeof updateTemplateSchema>