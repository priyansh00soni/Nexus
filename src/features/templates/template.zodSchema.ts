import { z } from 'zod'
import { Channel } from '../../generated/prisma/enums.js'

export const createTemplateSchema = z.object({
    message: z.string({ error: "Message is required" }).min(1, "Message cannot be empty"),
    subject: z.string().optional()
})

export const updateTemplateSchema = z.object({
    message: z.string().min(1, "Message cannot be empty").optional(),
    subject: z.string().optional()
})

export type CreateTemplateInput = z.infer<typeof createTemplateSchema>
export type updateTemplateInput = z.infer<typeof updateTemplateSchema>