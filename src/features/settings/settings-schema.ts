import { z } from 'zod'

export const settingsSchema = z.object({
  displayName: z.string().trim().min(2, 'Name must be at least 2 characters').max(40, 'Name must be 40 characters or fewer'),
  email: z.email('Enter a valid email address'),
  notifyOrders: z.boolean(),
  notifyAlerts: z.boolean(),
  confirmOrders: z.boolean(),
})

export type SettingsFormValues = z.infer<typeof settingsSchema>
