import { z } from 'zod'

import { alertTargetError } from '@/lib/trading'

export function createAlertSchema(prices: Record<string, number>) {
  return z
    .object({
      symbol: z.string().min(1, 'Select an instrument'),
      direction: z.enum(['above', 'below']),
      targetPrice: z.number({ error: 'Enter a target price' }).positive('Target price must be greater than zero'),
    })
    .superRefine((values, ctx) => {
      const price = prices[values.symbol]
      if (price === undefined) return
      const message = alertTargetError(values.direction, values.targetPrice, price)
      if (message) ctx.addIssue({ code: 'custom', path: ['targetPrice'], message })
    })
}

export type AlertFormValues = z.infer<ReturnType<typeof createAlertSchema>>
