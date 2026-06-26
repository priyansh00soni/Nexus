import { z } from 'zod'
import { Channel } from '../../generated/prisma/enums.js'

const rawSchema = z.object({
    message: z.string(),
    channel: z.enum([Channel.EMAIL, Channel.INAPP, Channel.WEBHOOK]),
    recipient:z.string()
})

const templateSchema = z.object({
    recipient:z.string(),
    template_id: z.string()
})

export const createNotificationSchema = z.union([rawSchema,templateSchema]).refine(
    (data) => !('template_id' in data && 'message' in data),
    { message: "Provide either template_id or message, not both" }
)

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>