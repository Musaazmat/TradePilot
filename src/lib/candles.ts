import type { UTCTimestamp } from 'lightweight-charts'

import { SIMULATION_ANCHOR_ISO } from '@/data/seed'
import type { Candle, Instrument, Timeframe } from '@/types/trading'

import { hashString, mulberry32 } from './random'
import { round2 } from './trading'

const CONFIG: Record<Timeframe, { days: number; perDay: number; stepSeconds: number }> = {
  '1D': { days: 1, perDay: 48, stepSeconds: 30 * 60 },
  '1W': { days: 5, perDay: 8, stepSeconds: 3 * 60 * 60 },
  '1M': { days: 30, perDay: 1, stepSeconds: 24 * 60 * 60 },
}

export function buildCandles(instrument: Instrument, timeframe: Timeframe): Candle[] {
  const { days, perDay, stepSeconds } = CONFIG[timeframe]
  const closes = instrument.history.slice(-(days + 1))
  const rand = mulberry32(hashString(`${instrument.symbol}-${timeframe}`))

  const path = closes.slice(0, 1)
  closes.slice(1).forEach((end, segment) => {
    const start = closes[segment] ?? end
    for (let step = 1; step <= perDay; step++) {
      const t = step / perDay
      const noise = (rand() - 0.5) * 0.01 * start * Math.sin(Math.PI * t)
      path.push(round2(start + (end - start) * t + noise))
    }
  })

  const total = path.length - 1
  const anchor = Date.parse(SIMULATION_ANCHOR_ISO) / 1000
  return path.slice(1).map((close, i) => {
    const open = path[i] ?? close
    return {
      time: (anchor - (total - 1 - i) * stepSeconds) as UTCTimestamp,
      open,
      high: round2(Math.max(open, close) + rand() * 0.004 * close),
      low: round2(Math.min(open, close) - rand() * 0.004 * close),
      close,
      volume: Math.round((instrument.avgVolume / perDay) * (0.6 + rand() * 0.8)),
    }
  })
}
