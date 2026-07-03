import { z } from 'zod'
import { Channel } from '../../generated/prisma/enums.js'

const rawSchema = z.object({
    message: z.string(),
    channel: z.enum([Channel.EMAIL, Channel.INAPP, Channel.WEBHOOK]),
    recipient:z.string(),
    variables: z.record(z.string(), z.unknown()).optional(),
    subject:z.string().optional(),
    scheduledFor:z.coerce.date().optional()
})

const templateSchema = z.object({
    recipient:z.string(),
    channel: z.enum([Channel.EMAIL, Channel.INAPP, Channel.WEBHOOK]),
    template_id: z.string(),
    variables: z.record(z.string(), z.unknown()).optional(),
    subject:z.string().optional(),
    scheduledFor: z.coerce.date().optional()
})

export const getNotificationStatusSchema = z.object({
    notification_id:z.string({ error: "Notification ID is required" })
})

export const createNotificationSchema = z.union([rawSchema,templateSchema]).refine(
    (data) => !('template_id' in data && 'message' in data),
    { message: "Provide either template_id or message, not both" }
)

export const getNotificationsSchema = z.object({
    page: z.coerce.number().default(1),
    limit: z.coerce.number().default(20),
    sortBy: z.enum(['created_at', 'scheduledFor']).default('created_at'),
    sortType: z.enum(['asc', 'desc']).default('desc'),
    status: z.enum(["COMPLETED","FAILED","PROCESSING","SCHEDULED" ]).optional(),
    channel: z.enum(["EMAIL","INAPP","WEBHOOK"]).optional(),
    from: z.coerce.date().optional(),
    to: z.coerce.date().optional()
})

export type getNotificationsInput = z.infer<typeof getNotificationsSchema>

export type CreateNotificationInput = z.infer<typeof createNotificationSchema>

export type getNotificationStatusInput = z.infer<typeof getNotificationStatusSchema>