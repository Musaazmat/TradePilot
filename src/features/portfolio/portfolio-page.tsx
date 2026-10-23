import type { ColumnDef } from '@tanstack/react-table'
import { useMemo } from 'react'
import { Link } from 'react-router'
import { Cell, Pie, PieChart } from 'recharts'

import { Panel } from '@/components/shared/panel'
import { DataTable } from '@/components/shared/data-table'
import { PageHeading } from '@/components/shared/page-heading'
import { PriceChange, toneClass } from '@/components/shared/price-change'
import { StatCard } from '@/components/shared/stat-card'
import { buttonVariants } from '@/components/ui/button'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { formatCurrency, formatPercent, formatQuantity, formatSignedCurrency } from '@/lib/format'
import { portfolioSummary } from '@/lib/trading'
import { urls } from '@/routes/urls'
import { useAppState } from '@/state/app-state'

type Row = ReturnType<typeof portfolioSummary>['rows'][number]

export function PortfolioPage() {
  const { state } = useAppState()
  const summary = useMemo(() => portfolioSummary(state), [state])

  const allocation = [
    ...summary.rows.map((r) => ({ name: r.holding.symbol, value: r.marketValue })),
    { name: 'Cash', value: state.cash },
  ]
  const slotColors = ['var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)', 'var(--chart-4)']
  const chartConfig = Object.fromEntries(allocation.map((slice) => [slice.name, { label: slice.name }])) satisfies ChartConfig

  const columns: ColumnDef<Row>[] = [
    {
      id: 'symbol',
      accessorFn: (r) => r.holding.symbol,
      header: 'Instrument',
      cell: ({ row }) => (
        <Link to={`${urls.trading}?symbol=${row.original.holding.symbol}`} className="flex flex-col">
          <span className="font-medium  hover:underline">{row.original.holding.symbol}</span>
          <span className="text-muted-foreground text-xs">{row.original.instrument.name}</span>
        </Link>
      ),
    },
    { id: 'quantity', accessorFn: (r) => r.holding.quantity, header: 'Qty', cell: ({ row }) => formatQuantity(row.original.holding.quantity) },
    { id: 'avg', accessorFn: (r) => r.holding.averagePrice, header: 'Avg price', cell: ({ row }) => formatCurrency(row.original.holding.averagePrice) },
    { id: 'price', accessorFn: (r) => r.instrument.price, header: 'Price', cell: ({ row }) => formatCurrency(row.original.instrument.price) },
    { id: 'value', accessorFn: (r) => r.marketValue, header: 'Market value', cell: ({ row }) => formatCurrency(row.original.marketValue) },
    { id: 'pnl', accessorFn: (r) => r.unrealizedPnl, header: 'Unrealized P/L', cell: ({ row }) => <span className={toneClass(row.original.unrealizedPnl)}>{formatSignedCurrency(row.original.unrealizedPnl)}</span> },
    { id: 'return', accessorFn: (r) => r.returnPercent, header: 'Return', cell: ({ row }) => <PriceChange percent={row.original.returnPercent} /> },
    {
      id: 'links',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <Link to={`${urls.transactions}?symbol=${row.original.holding.symbol}`} className="text-primary text-xs hover:underline">Transactions</Link>
      ),
    },
  ]

  return (
    <>
      <PageHeading title="Portfolio" description="Monitor your holdings, portfolio value, and overall investment performance." />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total value" value={formatCurrency(summary.totalValue)} sub={`Holdings ${formatCurrency(summary.marketValue)} · Cash ${formatCurrency(state.cash)}`} />
        <StatCard label="Unrealized P/L" value={formatSignedCurrency(summary.unrealizedPnl)} valueClassName={toneClass(summary.unrealizedPnl)} sub="Open positions" />
        <StatCard label="Realized P/L" value={formatSignedCurrency(summary.realizedPnl)} valueClassName={toneClass(summary.realizedPnl)} sub={`Total return ${formatPercent(summary.totalReturnPercent, true)}`} />
      </div>

      {summary.rows.length === 0 ? (
        <div className="mt-3">
          <DataTable
            data={[]}
            columns={columns}
            emptyTitle="No holdings"
            emptyDescription="Your portfolio is empty. Start trading to track positions and investment performance."
            emptyAction={<Link to={urls.trading} className={buttonVariants({ variant: 'default', size: 'sm' })}>Open terminal</Link>}
          />
        </div>
      ) : (
        <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_280px]">
          <DataTable data={summary.rows} columns={columns} numericColumns={['quantity', 'avg', 'price', 'value', 'pnl', 'return']} getRowId={(r) => r.holding.symbol} />
          <Panel title="Allocation">
            <ChartContainer config={chartConfig} className="mx-auto aspect-square h-48">
              <PieChart>
                <ChartTooltip content={<ChartTooltipContent hideLabel nameKey="name" formatter={(value, name) => <span className="flex w-full justify-between gap-3"><span>{name}</span><span className="tabular-nums">{formatCurrency(Number(value))}</span></span>} />} />
                <Pie isAnimationActive={false} data={allocation} dataKey="value" nameKey="name" innerRadius={45} outerRadius={72} stroke="var(--card)" strokeWidth={2}>
                  {allocation.map((slice, i) => (
                    <Cell key={slice.name} fill={slice.name === 'Cash' ? 'var(--muted-foreground)' : (slotColors[i] ?? 'var(--chart-4)')} />
                  ))}
                </Pie>
              </PieChart>
            </ChartContainer>
            <ul className="num mt-2 space-y-1 text-xs">
              {allocation.map((slice) => (
                <li key={slice.name} className="flex justify-between">
                  <span>{slice.name}</span>
                  <span className="text-muted-foreground">{formatPercent((slice.value / summary.totalValue) * 100)}</span>
                </li>
              ))}
            </ul>
          </Panel>
        </div>
      )}
    </>
  )
}
