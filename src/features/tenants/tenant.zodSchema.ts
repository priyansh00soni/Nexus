import { z } from 'zod'

export const createTenantSchema = z.object({
    name: z.string({ error: "Notification ID is required" }).min(1, "Name cannot be empty").max(100,"Name cannot be longer than 100 characters."),
    from_email: z.string().optional()
})

export type CreateTenantInput = z.infer<typeof createTenantSchema>