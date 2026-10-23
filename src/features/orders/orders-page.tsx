import type { ColumnDef } from '@tanstack/react-table'
import { MoreHorizontal } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useSearchParams } from 'react-router'
import { toast } from 'sonner'

import { SideBadge, StatusBadge } from '@/components/shared/badges'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { DataTable } from '@/components/shared/data-table'
import { PageHeading } from '@/components/shared/page-heading'
import { SearchInput } from '@/components/shared/search-input'
import { Button, buttonVariants } from '@/components/ui/button'
import { Field, FieldLabel } from '@/components/ui/field'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { Separator } from '@/components/ui/separator'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { withParam } from '@/lib/search-params'
import { urls } from '@/routes/urls'
import { useAppState } from '@/state/app-state'
import { OrderForm } from '@/features/trading/order-form'
import type { Order } from '@/types/trading'

const statusTabs = [
  { value: 'all', label: 'All' },
  { value: 'pending', label: 'Pending' },
  { value: 'filled', label: 'Filled' },
  { value: 'cancelled', label: 'Cancelled' },
]

export function OrdersPage() {
  const { state, dispatch } = useAppState()
  const [params, setParams] = useSearchParams()
  const [detailsId, setDetailsId] = useState<string | null>(null)
  const [cancelId, setCancelId] = useState<string | null>(null)
  const [newOrderOpen, setNewOrderOpen] = useState(false)
  const [newOrderSymbol, setNewOrderSymbol] = useState('')

  const query = params.get('q') ?? ''
  const status = params.get('status') ?? ''
  const rows = useMemo(() => {
    const term = query.trim().toLowerCase()
    return state.orders.filter(
      (o) => (!status || o.status === status) && (!term || o.symbol.toLowerCase().includes(term) || o.id.toLowerCase().includes(term)),
    )
  }, [state.orders, query, status])

  const details = state.orders.find((o) => o.id === detailsId)
  const cancelTarget = state.orders.find((o) => o.id === cancelId)
  const newOrderInstrument = state.instruments.find((i) => i.symbol === newOrderSymbol) ?? state.instruments[0]

  const columns: ColumnDef<Order>[] = [
    { id: 'id', accessorFn: (o) => o.id, header: 'Order', cell: ({ row }) => <span className="font-mono text-xs">{row.original.id}</span> },
    { id: 'symbol', accessorFn: (o) => o.symbol, header: 'Symbol', cell: ({ row }) => <span className="font-medium">{row.original.symbol}</span> },
    { id: 'side', accessorFn: (o) => o.side, header: 'Side', cell: ({ row }) => <SideBadge side={row.original.side} /> },
    { id: 'type', accessorFn: (o) => o.type, header: 'Type', cell: ({ row }) => <span className="capitalize">{row.original.type}</span> },
    { id: 'quantity', accessorFn: (o) => o.quantity, header: 'Qty', cell: ({ row }) => row.original.quantity },
    { id: 'limit', accessorFn: (o) => o.limitPrice ?? 0, header: 'Limit', cell: ({ row }) => (row.original.limitPrice ? formatCurrency(row.original.limitPrice) : '—') },
    { id: 'status', accessorFn: (o) => o.status, header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
    { id: 'created', accessorFn: (o) => o.createdAt, header: 'Created', cell: ({ row }) => <span className="text-muted-foreground">{formatDateTime(row.original.createdAt)}</span> },
    {
      id: 'actions',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <div className="flex justify-end" onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label={`Actions for order ${row.original.id}`}>
                <MoreHorizontal aria-hidden />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={() => setDetailsId(row.original.id)}>View details</DropdownMenuItem>
              {row.original.status === 'pending' && (
                <>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem variant="destructive" onSelect={() => setCancelId(row.original.id)}>Cancel order</DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeading
        title="Orders"
        description="View and manage your open orders, including pending limit orders and execution status."
        actions={<Button size="sm" onClick={() => setNewOrderOpen(true)}>New order</Button>}
      />
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <SearchInput value={query} onChange={(v) => setParams(withParam(params, 'q', v), { replace: true })} placeholder="Search symbol or order ID" className="w-full sm:w-64" />
        <Tabs value={status || 'all'} onValueChange={(v) => setParams(withParam(params, 'status', v === 'all' ? '' : v), { replace: true })}>
          <TabsList aria-label="Filter by status">
            {statusTabs.map((tab) => <TabsTrigger key={tab.value} value={tab.value}>{tab.label}</TabsTrigger>)}
          </TabsList>
        </Tabs>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        numericColumns={['quantity', 'limit']}
        getRowId={(o) => o.id}
        onRowClick={(o) => setDetailsId(o.id)}
        emptyTitle={state.orders.length === 0 ? 'No orders yet' : 'No matching orders'}
        emptyDescription={state.orders.length === 0 ? 'Place a order from the trading terminal.' : 'Try a different search or status filter.'}
        emptyAction={state.orders.length === 0 ? <Button size="sm" onClick={() => setNewOrderOpen(true)}>New order</Button> : undefined}
      />

      <Sheet open={newOrderOpen} onOpenChange={setNewOrderOpen}>
        <SheetContent className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>New order</SheetTitle>
            <SheetDescription>Set your instrument, order type, quantity, and price.</SheetDescription>
          </SheetHeader>
          {newOrderInstrument && (
            <div className="flex flex-col gap-4 px-4 pb-4">
              <Field>
                <FieldLabel htmlFor="new-order-symbol">Instrument</FieldLabel>
                <Select value={newOrderInstrument.symbol} onValueChange={setNewOrderSymbol}>
                  <SelectTrigger id="new-order-symbol" className="w-full"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {state.instruments.map((i) => <SelectItem key={i.symbol} value={i.symbol}>{i.symbol} · {i.name} · {formatCurrency(i.price)}</SelectItem>)}
                  </SelectContent>
                </Select>
              </Field>
              <OrderForm key={newOrderInstrument.symbol} instrument={newOrderInstrument} defaultSide="buy" onSubmitted={() => setNewOrderOpen(false)} />
            </div>
          )}
        </SheetContent>
      </Sheet>

      <Sheet open={!!details} onOpenChange={(open) => !open && setDetailsId(null)}>
        <SheetContent className="overflow-y-auto">
          {details && (
            <>
              <SheetHeader>
                <SheetTitle>Order {details.id}</SheetTitle>
                <SheetDescription>Review order details, execution status, and activity history.</SheetDescription>
              </SheetHeader>
              <div className="flex flex-col gap-4 px-4 pb-4 text-sm">
                <dl className="grid grid-cols-2 gap-y-2 tabular-nums">
                  <dt className="text-muted-foreground">Instrument</dt><dd className="text-right">{details.symbol}</dd>
                  <dt className="text-muted-foreground">Side / type</dt><dd className="text-right capitalize">{details.side} · {details.type}</dd>
                  <dt className="text-muted-foreground">Quantity</dt><dd className="text-right">{details.quantity}</dd>
                  <dt className="text-muted-foreground">Limit price</dt><dd className="text-right">{details.limitPrice ? formatCurrency(details.limitPrice) : '—'}</dd>
                  <dt className="text-muted-foreground">Status</dt><dd className="flex justify-end"><StatusBadge status={details.status} /></dd>
                </dl>
                <Separator />
                <ol className="flex flex-col gap-1.5">
                  {details.statusHistory.map((h, i) => (
                    <li key={i} className="flex justify-between gap-3 text-xs">
                      <span><span className="capitalize">{h.status}</span> · <span className="text-muted-foreground">{h.note}</span></span>
                      <span className="text-muted-foreground whitespace-nowrap">{formatDateTime(h.at)}</span>
                    </li>
                  ))}
                </ol>
                <div className="flex justify-end gap-2">
                  {details.transactionId && <Link to={urls['tradeDetails'].replace(':transactionId', details.transactionId)} className={buttonVariants({ variant: 'outline', size: 'sm' })}>View trade</Link>}
                  {details.status === 'pending' && <Button size="sm" variant="sell" onClick={() => { setCancelId(details.id); setDetailsId(null) }}>Cancel order</Button>}
                </div>
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>

      <ConfirmDialog
        open={!!cancelTarget}
        onOpenChange={(open) => !open && setCancelId(null)}
        title="Cancel pending order?"
        description={cancelTarget ? `${cancelTarget.side.toUpperCase()} ${cancelTarget.quantity} ${cancelTarget.symbol} will not be executed.` : ''}
        confirmLabel="Cancel order"
        onConfirm={() => {
          if (!cancelTarget) return
          dispatch({ type: 'order_cancelled', orderId: cancelTarget.id, now: new Date().toISOString() })
          toast.success(`Order ${cancelTarget.id} cancelled`)
        }}
      />
    </>
  )
}
