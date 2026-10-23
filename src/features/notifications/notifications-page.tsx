import { zodResolver } from '@hookform/resolvers/zod'
import { Bell, Check, FlaskConical, Trash2 } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Controller, useForm } from 'react-hook-form'
import { toast } from 'sonner'

import { SeverityBadge } from '@/components/shared/badges'
import { PageHeading } from '@/components/shared/page-heading'
import { Panel } from '@/components/shared/panel'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Field, FieldDescription, FieldError, FieldLabel } from '@/components/ui/field'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { cn } from '@/lib/utils'
import { useAppState } from '@/state/app-state'

import { createAlertSchema, type AlertFormValues } from './alert-schema'

export function NotificationsPage() {
  const { state, dispatch } = useAppState()
  const [filter, setFilter] = useState<'all' | 'unread'>('all')
  const prices = useMemo(() => Object.fromEntries(state.instruments.map((i) => [i.symbol, i.price])), [state.instruments])
  const schema = useMemo(() => createAlertSchema(prices), [prices])
  const { register, handleSubmit, reset, watch, control, formState: { errors } } = useForm<AlertFormValues>({
    resolver: zodResolver(schema),
    defaultValues: { symbol: state.instruments[0]?.symbol ?? '', direction: 'above' },
  })
  const selected = watch('symbol')
  const unread = state.notifications.filter((n) => !n.read).length
  const visible = filter === 'unread' ? state.notifications.filter((n) => !n.read) : state.notifications

  const onSubmit = (values: AlertFormValues) => {
    dispatch({ type: 'alert_added', input: values, now: new Date().toISOString() })
    toast.success(`Alert set: ${values.symbol} ${values.direction} ${formatCurrency(values.targetPrice)}`)
    reset({ symbol: values.symbol, direction: values.direction })
  }

  return (
    <>
      <PageHeading title="Notifications & Alerts" description="All your trading updates and price signals, together in one place." />
      <div className="grid gap-3 lg:grid-cols-2">
        <div className="flex flex-col gap-3">
          <Panel title="New price alert">
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-3 sm:grid-cols-2">
              <Field data-invalid={!!errors.symbol}>
                <FieldLabel htmlFor="alert-symbol">Instrument</FieldLabel>
                <Controller
                  control={control}
                  name="symbol"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="alert-symbol" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {state.instruments.map((i) => <SelectItem key={i.symbol} value={i.symbol}>{i.symbol} · {i.name}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  )}
                />
                {errors.symbol ? <FieldError>{errors.symbol.message}</FieldError> : prices[selected] !== undefined && <FieldDescription>Simulated price {formatCurrency(prices[selected])}</FieldDescription>}
              </Field>
              <Field>
                <FieldLabel htmlFor="alert-direction">Trigger when price is</FieldLabel>
                <Controller
                  control={control}
                  name="direction"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="alert-direction" className="w-full"><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="above">Above target</SelectItem>
                        <SelectItem value="below">Below target</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </Field>
              <Field data-invalid={!!errors.targetPrice} className="sm:col-span-2">
                <FieldLabel htmlFor="alert-target">Target price (USD)</FieldLabel>
                <Input id="alert-target" type="number" step="0.01" placeholder="0.00" aria-invalid={!!errors.targetPrice} aria-describedby={errors.targetPrice ? 'alert-target-error' : undefined} {...register('targetPrice', { setValueAs: (v) => (v === '' ? undefined : Number(v)) })} />
                {errors.targetPrice && <FieldError id="alert-target-error">{errors.targetPrice.message}</FieldError>}
              </Field>
              <div className="sm:col-span-2"><Button type="submit">Create alert</Button></div>
            </form>
          </Panel>

          <Panel title="Your alerts">
            {state.alerts.length === 0 ? (
              <p className="text-muted-foreground text-sm">No alerts yet. Create one above.</p>
            ) : (
              <ul className="divide-y">
                {state.alerts.map((a) => (
                  <li key={a.id} className="flex items-center justify-between gap-2 py-2 text-sm first:pt-0 last:pb-0">
                    <span>
                      <span className="font-medium">{a.symbol}</span> {a.direction} <span className="tabular-nums">{formatCurrency(a.targetPrice)}</span>
                      <span className="text-muted-foreground block text-xs">{a.status === 'active' ? 'Waiting for a simulated price update' : `Triggered ${formatDateTime(a.triggeredAt ?? a.createdAt)}`}</span>
                    </span>
                    <span className="flex items-center gap-1">
                      <Badge variant="secondary" className={a.status === 'active' ? 'bg-primary/15 text-primary' : 'bg-gain/15 text-gain'}>{a.status === 'active' ? 'Active' : 'Triggered'}</Badge>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button size="icon-sm" variant="ghost" aria-label={`Delete alert ${a.id}`} onClick={() => dispatch({ type: 'alert_removed', alertId: a.id })}><Trash2 aria-hidden /></Button>
                        </TooltipTrigger>
                        <TooltipContent>Delete alert</TooltipContent>
                      </Tooltip>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>

        <Panel
          title={`Notifications${unread ? ` · ${unread} unread` : ''}`}
          actions={<Button size="sm" variant="ghost" disabled={unread === 0} onClick={() => dispatch({ type: 'notifications_read_all' })}><Check aria-hidden /> Mark all read</Button>}
        >
          <Tabs value={filter} onValueChange={(v) => setFilter(v === 'unread' ? 'unread' : 'all')} className="mb-3">
            <TabsList aria-label="Filter notifications">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="unread">Unread</TabsTrigger>
            </TabsList>
          </Tabs>
          {visible.length === 0 ? (
            <p className="text-muted-foreground text-sm">{filter === 'unread' ? 'You are all caught up.' : 'No notifications.'}</p>
          ) : (
            <ScrollArea className="h-[420px] pr-3">
              <ul className="divide-y">
                {visible.map((n) => (
                  <li key={n.id} className="flex items-start gap-3 py-2.5 first:pt-0 last:pb-0">
                    <Bell className={cn('mt-0.5 size-4 shrink-0', n.read ? 'text-muted-foreground' : 'text-primary')} aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className={cn('flex flex-wrap items-center gap-2 text-sm', !n.read && 'font-medium')}>
                        <SeverityBadge severity={n.severity} />
                        {n.title}{!n.read && <span className="sr-only"> (unread)</span>}
                      </p>
                      <p className="text-muted-foreground text-xs">{n.message}</p>
                      <p className="text-muted-foreground mt-0.5 text-xs">{formatDateTime(n.createdAt)}</p>
                    </div>
                    {!n.read && <Button size="sm" variant="ghost" onClick={() => dispatch({ type: 'notification_read', id: n.id })}>Mark read</Button>}
                  </li>
                ))}
              </ul>
            </ScrollArea>
          )}
        </Panel>
      </div>
    </>
  )
}
