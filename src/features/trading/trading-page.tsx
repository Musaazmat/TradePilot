import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router'

import { CandlestickChart } from '@/components/charts/candlestick-chart'
import { Panel } from '@/components/shared/panel'
import { EmptyState } from '@/components/shared/empty-state'
import { PageHeading } from '@/components/shared/page-heading'
import { PriceChange } from '@/components/shared/price-change'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { SegmentedControl } from '@/components/shared/segmented-control'
import { formatCurrency, formatQuantity, formatVolume } from '@/lib/format'
import { buildCandles } from '@/lib/candles'
import { availableToSell } from '@/lib/order-engine'
import { dayChange } from '@/lib/trading'
import { withParam } from '@/lib/search-params'
import { useAppState } from '@/state/app-state'
import type { Timeframe } from '@/types/trading'

import { OrderForm } from './order-form'

const timeframes: { value: Timeframe; label: string }[] = [
  { value: '1D', label: '1D' },
  { value: '1W', label: '1W' },
  { value: '1M', label: '1M' },
]

export function TradingPage() {
  const { state } = useAppState()
  const [params, setParams] = useSearchParams()
  const [timeframe, setTimeframe] = useState<Timeframe>('1D')

  const instrument = state.instruments.find((i) => i.symbol === params.get('symbol')) ?? state.instruments[0]
  const candles = useMemo(() => (instrument ? buildCandles(instrument, timeframe) : []), [instrument, timeframe])

  if (!instrument) return <EmptyState title="No instruments available" />

  const { change, percent } = dayChange(instrument)
  const held = state.holdings.find((h) => h.symbol === instrument.symbol)?.quantity ?? 0
  const sellable = availableToSell(state, instrument.symbol)
  const high = Math.max(...candles.map((c) => c.high))
  const low = Math.min(...candles.map((c) => c.low))
  const volume = candles.reduce((sum, c) => sum + c.volume, 0)
  const defaultSide = params.get('side') === 'sell' ? 'sell' : 'buy'

  return (
    <>
      <PageHeading title="Trading Terminal" description="Place market and limit orders, monitor live price movements, and manage your trades." />
      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_320px]">
        <Panel>
          <div className="mb-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-3">
              <Select value={instrument.symbol} onValueChange={(symbol) => setParams(withParam(params, 'symbol', symbol), { replace: true })}>
                <SelectTrigger aria-label="Instrument" className="w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {state.instruments.map((i) => (
                    <SelectItem key={i.symbol} value={i.symbol}>{i.symbol} · {i.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <span className="num text-xl font-semibold">{formatCurrency(instrument.price)}</span>
              <PriceChange change={change} percent={percent} className="text-sm" />
            </div>
            <SegmentedControl ariaLabel="Timeframe" value={timeframe} onChange={setTimeframe} options={timeframes} />
          </div>
          <CandlestickChart candles={candles} theme={state.preferences.theme} />
          <dl className="num mt-3 grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
            <Stat label={`High (${timeframe})`} value={formatCurrency(high)} />
            <Stat label={`Low (${timeframe})`} value={formatCurrency(low)} />
            <Stat label={`Volume (${timeframe})`} value={formatVolume(volume)} />
            <Stat label="Avg daily volume" value={formatVolume(instrument.avgVolume)} />
          </dl>
          <p className="text-muted-foreground mt-3 text-xs">Visualizing market movements in a simulated trading environment.</p>
        </Panel>

        <div className="flex flex-col gap-3">
          <Panel title="Place order">
            <OrderForm key={`${instrument.symbol}-${defaultSide}`} instrument={instrument} defaultSide={defaultSide} />
          </Panel>
          <Panel title="Your position">
            <dl className="num grid grid-cols-2 gap-y-1.5 text-sm">
              <dt className="text-muted-foreground">Available cash</dt>
              <dd className="text-right">{formatCurrency(state.cash)}</dd>
              <dt className="text-muted-foreground">{instrument.symbol} held</dt>
              <dd className="text-right">{formatQuantity(held)}</dd>
              <dt className="text-muted-foreground">Available to sell</dt>
              <dd className="text-right">{formatQuantity(sellable)}</dd>
            </dl>
          </Panel>
        </div>
      </div>
    </>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{value}</dd>
    </div>
  )
}
