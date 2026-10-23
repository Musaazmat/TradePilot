import { z } from 'zod'

import { checkAffordability, orderEstimate } from '@/lib/trading'

interface OrderSchemaContext {
  price: number
  cash: number
  sellable: number
}

/** Built per render context so balance and holdings checks use live values. */
export function createOrderSchema({ price, cash, sellable }: OrderSchemaContext) {
  return z
    .object({
      side: z.enum(['buy', 'sell']),
      type: z.enum(['market', 'limit']),
      quantity: z
        .number({ error: 'Enter a quantity' })
        .int('Quantity must be a whole number')
        .positive('Quantity must be greater than zero'),
      limitPrice: z.number({ error: 'Enter a valid price' }).positive('Limit price must be greater than zero').optional(),
    })
    .superRefine((values, ctx) => {
      if (values.type === 'limit' && values.limitPrice === undefined) {
        ctx.addIssue({ code: 'custom', path: ['limitPrice'], message: 'Limit price is required for limit orders' })
        return
      }
      const limit = values.type === 'limit' ? values.limitPrice : undefined
      const crosses = limit === undefined || (values.side === 'buy' ? price <= limit : price >= limit)
      const message = checkAffordability({
        side: values.side,
        quantity: values.quantity,
        unitPrice: crosses ? price : (limit ?? price),
        cash,
        sellable,
      })
      if (message) ctx.addIssue({ code: 'custom', path: ['quantity'], message })
    })
}

export type OrderFormValues = z.infer<ReturnType<typeof createOrderSchema>>

export { orderEstimate }
