import { zodResolver } from '@hookform/resolvers/zod'
import { useMemo, useState } from 'react'
import { useForm, useWatch } from 'react-hook-form'
import { toast } from 'sonner'

import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { SegmentedControl } from '@/components/shared/segmented-control'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { formatCurrency } from '@/lib/format'
import { availableToSell, isMarketable, validateOrder } from '@/lib/order-engine'
import { orderEstimate } from '@/lib/trading'
import { useAppState } from '@/state/app-state'
import type { Instrument, OrderInput, OrderSide } from '@/types/trading'

import { createOrderSchema, type OrderFormValues } from './order-schema'

const numberOrUndefined = (value: unknown) => (value === '' || value == null ? undefined : Number(value))

interface OrderFormProps {
  instrument: Instrument
  defaultSide: OrderSide
  /** Called after an order was accepted, e.g. to close a surrounding sheet. */
  onSubmitted?: () => void
}

export function OrderForm({ instrument, defaultSide, onSubmitted }: OrderFormProps) {
  const { state, dispatch } = useAppState()
  const sellable = availableToSell(state, instrument.symbol)
  const [awaitingConfirmation, setAwaitingConfirmation] = useState<OrderFormValues | null>(null)
  const schema = useMemo(
    () => createOrderSchema({ price: instrument.price, cash: state.cash, sellable }),
    [instrument.price, state.cash, sellable],
  )
  const { register, handleSubmit, control, setValue, clearErrors, reset, formState: { errors } } = useForm<OrderFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { side: defaultSide, type: 'market' },
  })
  const [side, type, quantity, limitPrice] = useWatch({ control, name: ['side', 'type', 'quantity', 'limitPrice'] })

  const unitPrice = type === 'limit' && limitPrice ? limitPrice : instrument.price
  const estimate = quantity > 0 ? orderEstimate(side, quantity, unitPrice) : null

  const submitOrder = (values: OrderFormValues) => {
    const input: OrderInput = {
      symbol: instrument.symbol,
      side: values.side,
      type: values.type,
      quantity: values.quantity,
      limitPrice: values.type === 'limit' ? values.limitPrice : undefined,
    }
    const error = validateOrder(state, input)
    if (error) {
      toast.error('Order rejected', { description: error })
      return
    }
    const immediate = isMarketable(input.side, input.type, input.limitPrice, instrument.price)
    dispatch({ type: 'order_placed', input, now: new Date().toISOString() })
    toast.success(
      immediate
        ? `Simulated ${input.side} filled: ${input.quantity} ${instrument.symbol}`
        : `Limit order placed: ${input.quantity} ${instrument.symbol} @ ${formatCurrency(input.limitPrice ?? 0)}`,
      { description: immediate ? 'Executed at the current simulated price.' : 'Pending until the simulated price reaches your limit.' },
    )
    reset({ side: values.side, type: values.type })
    onSubmitted?.()
  }

  const onSubmit = (values: OrderFormValues) => {
    if (state.preferences.confirmOrders) setAwaitingConfirmation(values)
    else submitOrder(values)
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-3">
      {!state.marketOpen && (
        <Alert>
          <AlertTitle>Market closed</AlertTitle>
          <AlertDescription>Orders are paused while the simulated market is closed. Reopen it from the header to trade.</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-wrap gap-2">
        <SegmentedControl ariaLabel="Order side" value={side} onChange={(v) => { setValue('side', v); clearErrors() }} options={[{ value: 'buy', label: 'Buy' }, { value: 'sell', label: 'Sell' }]} />
        <SegmentedControl ariaLabel="Order type" value={type} onChange={(v) => { setValue('type', v); clearErrors() }} options={[{ value: 'market', label: 'Market' }, { value: 'limit', label: 'Limit' }]} />
      </div>

      <Field data-invalid={!!errors.quantity}>
        <FieldLabel htmlFor="quantity">Quantity</FieldLabel>
        <Input id="quantity" type="number" inputMode="numeric" step={1} min={1} placeholder="0" aria-invalid={!!errors.quantity} aria-describedby={errors.quantity ? 'quantity-error' : undefined} {...register('quantity', { setValueAs: numberOrUndefined })} />
        {errors.quantity && <FieldError id="quantity-error">{errors.quantity.message}</FieldError>}
      </Field>

      {type === 'limit' && (
        <Field data-invalid={!!errors.limitPrice}>
          <FieldLabel htmlFor="limitPrice">Limit price (USD)</FieldLabel>
          <Input id="limitPrice" type="number" step="0.01" min={0} placeholder="0.00" aria-invalid={!!errors.limitPrice} aria-describedby={errors.limitPrice ? 'limitPrice-error' : undefined} {...register('limitPrice', { setValueAs: numberOrUndefined })} />
          {errors.limitPrice ? <FieldError id="limitPrice-error">{errors.limitPrice.message}</FieldError> : <FieldDescription>Last simulated price {formatCurrency(instrument.price)}</FieldDescription>}
        </Field>
      )}

      <dl className="bg-muted grid grid-cols-2 gap-y-1 rounded-md p-3 text-xs tabular-nums">
        <dt className="text-muted-foreground">{type === 'limit' ? 'Limit price' : 'Est. price'}</dt>
        <dd className="text-right">{formatCurrency(unitPrice)}</dd>
        <dt className="text-muted-foreground">Order value</dt>
        <dd className="text-right">{estimate ? formatCurrency(estimate.gross) : '—'}</dd>
        <dt className="text-muted-foreground">Fee (0.1%, min $1)</dt>
        <dd className="text-right">{estimate ? formatCurrency(estimate.fee) : '—'}</dd>
        <dt className="font-medium">{side === 'buy' ? 'Total cost' : 'Net proceeds'}</dt>
        <dd className="text-right font-medium">{estimate ? formatCurrency(estimate.net) : '—'}</dd>
      </dl>

      <Button type="submit" variant={side === 'buy' ? 'buy' : 'sell'} size="lg" disabled={!state.marketOpen}>
        {side === 'buy' ? 'Buy' : 'Sell'} {instrument.symbol}
      </Button>
      {/* <p className="text-muted-foreground text-xs">Simulated execution at demo prices. No real order is sent.</p> */}
      <ConfirmDialog
        open={awaitingConfirmation !== null}
        onOpenChange={(open) => !open && setAwaitingConfirmation(null)}
        title="Confirm simulated order"
        description={awaitingConfirmation ? `${awaitingConfirmation.side === 'buy' ? 'Buy' : 'Sell'} ${awaitingConfirmation.quantity} ${instrument.symbol} (${awaitingConfirmation.type}). ${estimate ? `${side === 'buy' ? 'Total cost' : 'Net proceeds'} ${formatCurrency(estimate.net)}.` : ''}` : ''}
        confirmLabel={`${side === 'buy' ? 'Buy' : 'Sell'} ${instrument.symbol}`}
        cancelLabel="Edit order"
        confirmVariant={side === 'buy' ? 'buy' : 'sell'}
        onConfirm={() => awaitingConfirmation && submitOrder(awaitingConfirmation)}
      />
    </form>
  )
}
