import { ArrowLeft } from 'lucide-react'
import { Link, useParams } from 'react-router'

import { SideBadge, StatusBadge } from '@/components/shared/badges'
import { Panel } from '@/components/shared/panel'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeading } from '@/components/shared/page-heading'
import { toneClass } from '@/components/shared/price-change'
import { Button, buttonVariants } from '@/components/ui/button'
import { formatCurrency, formatDateTime, formatSignedCurrency } from '@/lib/format'
import { urls } from '@/routes/urls'
import { useAppState } from '@/state/app-state'

export function TradeDetailsPage() {
  const { transactionId } = useParams<{ transactionId: string }>()
  const { state } = useAppState()
  const transaction = state.transactions.find((t) => t.id === transactionId)
  const order = state.orders.find((o) => o.id === transaction?.orderId)
  const instrument = state.instruments.find((i) => i.symbol === transaction?.symbol)

  const back = (
    <Link to={urls.transactions} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
      <ArrowLeft className="size-3.5" /> Transactions
    </Link>
  )

  if (!transaction) {
    return (
      <>
        <PageHeading title="Trade details" actions={back} />
        <EmptyState title="Transaction not found" description={`No transaction matches “${transactionId ?? ''}”.`} />
      </>
    )
  }

  const net = transaction.side === 'buy' ? transaction.value + transaction.fee : transaction.value - transaction.fee

  return (
    <>
      <div className='flex items-start gap-3'>
        <Button asChild variant={"outline"} className='p-2 px-2.5 h-8 mt-0.5'>
          <Link to={urls.transactions}>
            <ArrowLeft className="size-3" />
          </Link>
        </Button>
        <PageHeading title={`Trade ${transaction.id}`} description={`Executed ${formatDateTime(transaction.executedAt)}`} />
      </div>
      <div className="grid gap-3 lg:grid-cols-2">
        <Panel title="Summary">
          <dl className="num grid grid-cols-2 gap-y-2 text-sm">
            <dt className="text-muted-foreground">Instrument</dt>
            <dd className="text-right"><Link to={`${urls.trading}?symbol=${transaction.symbol}`} className="text-primary hover:underline">{transaction.symbol}</Link> {instrument && <span className="text-muted-foreground text-xs">{instrument.name}</span>}</dd>
            <dt className="text-muted-foreground">Side</dt><dd className="text-right"><SideBadge side={transaction.side} /></dd>
            <dt className="text-muted-foreground">Order type</dt><dd className="text-right capitalize">{transaction.orderType}</dd>
            <dt className="text-muted-foreground">Requested / executed</dt><dd className="text-right">{transaction.requestedQuantity} / {transaction.executedQuantity}</dd>
            <dt className="text-muted-foreground">Execution price</dt><dd className="text-right">{formatCurrency(transaction.executionPrice)}</dd>
            <dt className="text-muted-foreground">Gross value</dt><dd className="text-right">{formatCurrency(transaction.value)}</dd>
            <dt className="text-muted-foreground">Fee</dt><dd className="text-right">{formatCurrency(transaction.fee)}</dd>
            <dt className="font-medium">{transaction.side === 'buy' ? 'Total cost' : 'Net proceeds'}</dt><dd className="text-right font-medium">{formatCurrency(net)}</dd>
            {transaction.realizedPnl !== null && (
              <>
                <dt className="text-muted-foreground">Realized P/L (after fee)</dt>
                <dd className={`text-right ${toneClass(transaction.realizedPnl)}`}>{formatSignedCurrency(transaction.realizedPnl)}</dd>
              </>
            )}
            <dt className="text-muted-foreground">Status</dt><dd className="text-right"><StatusBadge status={transaction.status} /></dd>
          </dl>
        </Panel>

        <div className="flex flex-col gap-3">
          <Panel title="Fill breakdown">
            <table className="num w-full text-sm">
              <thead className="text-muted-foreground text-xs"><tr><th className="text-left font-medium">Fill</th><th className="text-right font-medium">Qty</th><th className="text-right font-medium">Price</th><th className="text-right font-medium">Value</th></tr></thead>
              <tbody><tr className="border-t"><td className="py-1.5">#1</td><td className="text-right">{transaction.executedQuantity}</td><td className="text-right">{formatCurrency(transaction.executionPrice)}</td><td className="text-right">{formatCurrency(transaction.value)}</td></tr></tbody>
            </table>
            <p className="text-muted-foreground mt-2 text-xs">Simulated orders fill in a single execution.</p>
          </Panel>
          <Panel title="Order status history">
            {order ? (
              <ol className="space-y-2">
                {order.statusHistory.map((h, i) => (
                  <li key={i} className="flex justify-between gap-3 text-sm">
                    <span><StatusBadge status={h.status} /> <span className="text-muted-foreground ml-1 text-xs">{h.note}</span></span>
                    <span className="text-muted-foreground text-xs whitespace-nowrap">{formatDateTime(h.at)}</span>
                  </li>
                ))}
              </ol>
            ) : (
              <p className="text-muted-foreground text-sm">Linked order {transaction.orderId} is unavailable.</p>
            )}
          </Panel>
        </div>
      </div>
    </>
  )
}
