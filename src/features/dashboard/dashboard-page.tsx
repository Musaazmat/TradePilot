import { useMemo, useState } from 'react'
import { Link } from 'react-router'
import { Area, AreaChart, XAxis, YAxis } from 'recharts'

import { Panel } from '@/components/shared/panel'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeading } from '@/components/shared/page-heading'
import { PriceChange, toneClass } from '@/components/shared/price-change'
import { SideBadge } from '@/components/shared/badges'
import { StatCard } from '@/components/shared/stat-card'
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { formatCompactCurrency, formatCurrency, formatDateTime, formatPercent, formatSignedCurrency } from '@/lib/format'
import { dayChange, marketHistory, portfolioHistory, portfolioSummary, STARTING_CAPITAL } from '@/lib/trading'
import { urls } from '@/routes/urls'
import { useAppState } from '@/state/app-state'

type ChartView = 'portfolio' | 'market'

const chartConfig = { value: { label: 'Value', color: 'var(--chart-4)' } } satisfies ChartConfig
const formatIndex = (value: number) => value.toFixed(1)

export function DashboardPage() {
  const { state } = useAppState()
  const summary = useMemo(() => portfolioSummary(state), [state])
  const [view, setView] = useState<ChartView>('portfolio')
  const portfolioSeries = useMemo(() => portfolioHistory(state), [state])
  const marketSeries = useMemo(() => marketHistory(state), [state])
  const series = view === 'portfolio' ? portfolioSeries : marketSeries
  const movers = useMemo(
    () =>
      state.instruments
        .map((instrument) => ({ instrument, ...dayChange(instrument) }))
        .sort((a, b) => Math.abs(b.percent) - Math.abs(a.percent))
        .slice(0, 5),
    [state.instruments],
  )
  const watched = state.instruments.filter((i) => state.watchlist.includes(i.symbol)).slice(0, 4)
  const recent = state.transactions.slice(0, 5)

  return (
    <>
      <PageHeading
        title="Dashboard"
        description="Track your portfolio performance, account balance, and recent trading activity"
      // actions={
      //   <div className="flex gap-2">
      //     <Link to={`${urls.trading}?side=buy`} className={buttonVariants({ variant: 'buy', size: 'sm' })}>Buy</Link>
      //     <Link to={`${urls.trading}?side=sell`} className={buttonVariants({ variant: 'sell', size: 'sm' })}>Sell</Link>
      //     <Link to={urls.market} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Open market</Link>
      //   </div>
      // }
      />
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Total portfolio value" value={formatCurrency(summary.totalValue)} sub={`Holdings ${formatCurrency(summary.marketValue)} · Cash ${formatCurrency(state.cash)}`} />
        <StatCard
          label="Today's profit / loss"
          value={formatSignedCurrency(summary.dayPnl)}
          valueClassName={toneClass(summary.dayPnl)}
          sub={`${formatPercent(summary.dayPnlPercent, true)} vs previous close`}
        />
        <StatCard
          label="Overall return"
          value={formatPercent(summary.totalReturnPercent, true)}
          valueClassName={toneClass(summary.totalReturn)}
          sub={`${formatSignedCurrency(summary.totalReturn)} on ${formatCurrency(STARTING_CAPITAL)} deposited`}
        />
      </div>

      <div className="mt-3 grid gap-3 lg:grid-cols-3">
        <Panel
          title="Performance · 30 days"
          className="lg:col-span-2"
          actions={
            <Tabs value={view} onValueChange={(v) => setView(v === 'market' ? 'market' : 'portfolio')}>
              <TabsList aria-label="Chart view">
                <TabsTrigger value="portfolio">Portfolio</TabsTrigger>
                <TabsTrigger value="market">Market index</TabsTrigger>
              </TabsList>
            </Tabs>
          }
        >
          <ChartContainer config={chartConfig} className="aspect-auto h-56 w-full">
            <AreaChart data={series} margin={{ top: 4, right: 4, bottom: 0, left: 0 }}>
              <XAxis dataKey="date" tickLine={false} axisLine={false} minTickGap={36} />
              <YAxis domain={['auto', 'auto']} width={60} tickLine={false} axisLine={false} tickFormatter={view === 'portfolio' ? formatCompactCurrency : formatIndex} />
              <ChartTooltip content={<ChartTooltipContent indicator="line" formatter={(value) => <span className="tabular-nums">{view === 'portfolio' ? formatCurrency(Number(value)) : formatIndex(Number(value))}</span>} />} />
              <Area isAnimationActive={false} type="monotone" dataKey="value" stroke="var(--color-value)" fill="var(--color-value)" fillOpacity={0.1} strokeWidth={1.5} />
            </AreaChart>
          </ChartContainer>
        </Panel>

        <Panel title="Top movers">
          <ul className="divide-y">
            {movers.map(({ instrument, change, percent }) => (
              <li key={instrument.symbol} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                <Link to={`${urls.trading}?symbol=${instrument.symbol}`} className="hover:underline">
                  <span className="text-sm font-medium">{instrument.symbol}</span>
                  <span className="text-muted-foreground block text-xs">{formatCurrency(instrument.price)}</span>
                </Link>
                <PriceChange change={change} percent={percent} className="text-xs" />
              </li>
            ))}
          </ul>
        </Panel>

        <Panel title="Watchlist" actions={<Link to={urls.watchlist} className="text-primary text-xs hover:underline">View all</Link>}>
          {watched.length === 0 ? (
            <p className="text-muted-foreground text-sm">No instruments on your watchlist.</p>
          ) : (
            <ul className="divide-y">
              {watched.map((instrument) => (
                <li key={instrument.symbol} className="flex items-center justify-between py-2 first:pt-0 last:pb-0">
                  <Link to={`${urls.trading}?symbol=${instrument.symbol}`} className="text-sm font-medium hover:underline">{instrument.symbol}</Link>
                  <span className="num text-sm">{formatCurrency(instrument.price)}</span>
                  <PriceChange percent={dayChange(instrument).percent} className="text-xs" />
                </li>
              ))}
            </ul>
          )}
        </Panel>

        <Panel title="Recent transactions" className="lg:col-span-2" actions={<Link to={urls.transactions} className="text-primary text-xs hover:underline">View all</Link>}>
          {recent.length === 0 ? (
            <EmptyState title="No transactions yet" description="Executed orders appear here." />
          ) : (
            <ul className="divide-y">
              {recent.map((t) => (
                <li key={t.id}>
                  <Link to={urls['tradeDetails'].replace(':transactionId', t.id)} className="hover:bg-muted/50 flex items-center justify-between gap-3 py-2 text-sm">
                    <span className="flex items-center gap-2"><SideBadge side={t.side} /> {t.executedQuantity} {t.symbol}</span>
                    <span className="num">{formatCurrency(t.value)}</span>
                    <span className="text-muted-foreground hidden text-xs sm:inline">{formatDateTime(t.executedAt)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>
    </>
  )
}
