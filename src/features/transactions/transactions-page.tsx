import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'

import { SideBadge, StatusBadge } from '@/components/shared/badges'
import { DataTable } from '@/components/shared/data-table'
import { PageHeading } from '@/components/shared/page-heading'
import { SearchInput } from '@/components/shared/search-input'
import { buttonVariants } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { formatCurrency, formatDateTime } from '@/lib/format'
import { withParam } from '@/lib/search-params'
import { urls } from '@/routes/urls'
import { useAppState } from '@/state/app-state'
import type { Transaction } from '@/types/trading'

export function TransactionsPage() {
  const { state } = useAppState()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const query = params.get('q') ?? ''
  const side = params.get('side') ?? ''
  const symbol = params.get('symbol') ?? ''

  const rows = useMemo(() => {
    const term = query.trim().toLowerCase()
    return state.transactions.filter(
      (t) => (!side || t.side === side) && (!symbol || t.symbol === symbol) && (!term || t.symbol.toLowerCase().includes(term) || t.id.toLowerCase().includes(term)),
    )
  }, [state.transactions, query, side, symbol])

  const columns: ColumnDef<Transaction>[] = [
    { id: 'date', accessorFn: (t) => t.executedAt, header: 'Executed', cell: ({ row }) => <span className="text-muted-foreground">{formatDateTime(row.original.executedAt)}</span> },
    {
      id: 'id',
      accessorFn: (t) => t.id,
      header: 'Transaction',
      cell: ({ row }) => (
        <Link to={urls['tradeDetails'].replace(':transactionId', row.original.id)} onClick={(e) => e.stopPropagation()} className="text-primary font-mono text-xs hover:underline">{row.original.id}</Link>
      ),
    },
    { id: 'symbol', accessorFn: (t) => t.symbol, header: 'Symbol', cell: ({ row }) => <span className="font-medium">{row.original.symbol}</span> },
    { id: 'side', accessorFn: (t) => t.side, header: 'Type', cell: ({ row }) => <SideBadge side={row.original.side} /> },
    { id: 'quantity', accessorFn: (t) => t.executedQuantity, header: 'Qty', cell: ({ row }) => row.original.executedQuantity },
    { id: 'price', accessorFn: (t) => t.executionPrice, header: 'Price', cell: ({ row }) => formatCurrency(row.original.executionPrice) },
    { id: 'fee', accessorFn: (t) => t.fee, header: 'Fee', cell: ({ row }) => formatCurrency(row.original.fee) },
    { id: 'value', accessorFn: (t) => t.value, header: 'Value', cell: ({ row }) => formatCurrency(row.original.value) },
    { id: 'status', header: 'Status', enableSorting: false, cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  ]

  return (
    <>
      <PageHeading title="Transactions" description="View your trade history, execution details, and transaction records." />
      <div className="mb-3 flex flex-wrap gap-2">
        <SearchInput value={query} onChange={(v) => setParams(withParam(params, 'q', v), { replace: true })} placeholder="Search symbol or transaction ID" className="w-full sm:w-64" />
        <Select value={side || 'all'} onValueChange={(v) => setParams(withParam(params, 'side', v === 'all' ? '' : v), { replace: true })}>
          <SelectTrigger aria-label="Filter by type" className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Buys and sells</SelectItem>
            <SelectItem value="buy">Buys</SelectItem>
            <SelectItem value="sell">Sells</SelectItem>
          </SelectContent>
        </Select>
        <Select value={symbol || 'all'} onValueChange={(v) => setParams(withParam(params, 'symbol', v === 'all' ? '' : v), { replace: true })}>
          <SelectTrigger aria-label="Filter by instrument" className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All instruments</SelectItem>
            {state.instruments.map((i) => <SelectItem key={i.symbol} value={i.symbol}>{i.symbol}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      <DataTable
        data={rows}
        columns={columns}
        numericColumns={['quantity', 'price', 'fee', 'value']}
        initialSorting={[{ id: 'date', desc: true }]}
        getRowId={(t) => t.id}
        onRowClick={(t) => navigate(urls['tradeDetails'].replace(':transactionId', t.id))}
        emptyTitle={state.transactions.length === 0 ? 'No transactions yet' : 'No matching transactions'}
        emptyDescription={state.transactions.length === 0 ? 'Executed orders appear here.' : 'Try clearing a filter.'}
        emptyAction={state.transactions.length === 0 ? <Link to={urls.trading} className={buttonVariants({ variant: 'default', size: 'sm' })}>Open terminal</Link> : undefined}
      />
    </>
  )
}
