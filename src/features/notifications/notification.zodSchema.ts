import { z } from 'zod'
import { Channel } from '../../generated/prisma/enums.js'

const rawSchema = z.object({
    message: z.string(),
    channel: z.enum([Channel.EMAIL, Channel.INAPP, Channel.WEBHOOK]),
    recipient:z.string(),
    variables: z.record(z.string(), z.unknown()).optional(),
    subject:z.string().optional()
    scheduledFor:z.coerce.date().optional()
})

const templateSchema = z.object({
    recipient:z.string(),
    template_id: z.string(),
    variables: z.record(z.string(), z.unknown()).optional(),
    subject:z.string().optional()
})

export const createNotificationSchema = z.union([rawSchema,templateSchema]).refine(
    (data) => !('template_id' in data && 'message' in data),
    { message: "Provide either template_id or message, not both" }
)

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>