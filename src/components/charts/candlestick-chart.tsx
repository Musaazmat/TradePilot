import { CandlestickSeries, ColorType, HistogramSeries, createChart } from 'lightweight-charts'
import { useEffect, useRef, useState } from 'react'

import { Skeleton } from '@/components/ui/skeleton'
import { resolveCssColor } from '@/lib/css-color'
import type { Candle, ThemePreference } from '@/types/trading'

interface CandlestickChartProps {
  candles: Candle[]
  theme: ThemePreference
}

export function CandlestickChart({ candles, theme }: CandlestickChartProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const token = (name: string) => resolveCssColor(name)
    const gain = token('--gain')
    const loss = token('--loss')

    const chart = createChart(container, {
      autoSize: true,
      localization: { locale: 'en-US' },
      layout: { background: { type: ColorType.Solid, color: token('--card') }, textColor: token('--muted-foreground') },
      grid: { vertLines: { color: token('--border') }, horzLines: { color: token('--border') } },
      rightPriceScale: { borderColor: token('--border') },
      timeScale: { borderColor: token('--border'), timeVisible: true },
    })
    const series = chart.addSeries(CandlestickSeries, {
      upColor: gain,
      downColor: loss,
      borderVisible: false,
      wickUpColor: gain,
      wickDownColor: loss,
    })
    series.setData(candles)

    const volume = chart.addSeries(HistogramSeries, { priceFormat: { type: 'volume' }, priceScaleId: '' })
    volume.priceScale().applyOptions({ scaleMargins: { top: 0.82, bottom: 0 } })
    volume.setData(
      candles.map((c) => ({ time: c.time, value: c.volume, color: resolveCssColor(c.close >= c.open ? '--gain' : '--loss', 0.35) })),
    )
    chart.timeScale().fitContent()
    setReady(true)

    return () => chart.remove()
  }, [candles, theme])

  return (
    <div className="relative h-72 sm:h-96" role="img" aria-label="Candlestick chart with volume">
      {!ready && <Skeleton className="absolute inset-0" />}
      <div ref={containerRef} className="size-full" />
    </div>
  )
}
