import { z } from 'zod'

export const createTenantSchema = z.object({
    name: z.string().min(1, "Name cannot be empty").max(100,"Name cannot be longer than 100 characters."),
    from_email: z.string()
})

export type CreateTenantInput = z.infer<typeof createTenantSchema>