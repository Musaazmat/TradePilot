import { format, subDays } from 'date-fns'

import { SIMULATION_ANCHOR_ISO } from '@/data/seed'
import type { AlertDirection, AppState, Holding, Instrument, OrderSide } from '@/types/trading'

import { formatCurrency } from './format'

/** Capital deposited into the demo account; the baseline for overall return. */
export const STARTING_CAPITAL = 100_000
/** Flat fee rate applied to every execution, with a minimum per order. */
export const FEE_RATE = 0.001
export const MIN_FEE = 1

export const round2 = (value: number) => Math.round(value * 100) / 100

export function calculateFee(grossValue: number) {
  return round2(Math.max(MIN_FEE, grossValue * FEE_RATE))
}

/** Buys pay gross + fee; sells receive gross - fee. */
export function orderEstimate(side: OrderSide, quantity: number, unitPrice: number) {
  const gross = round2(quantity * unitPrice)
  const fee = calculateFee(gross)
  return { gross, fee, net: side === 'buy' ? round2(gross + fee) : round2(gross - fee) }
}

export function dayChange(instrument: Pick<Instrument, 'price' | 'previousClose'>) {
  const change = round2(instrument.price - instrument.previousClose)
  const percent = instrument.previousClose === 0 ? 0 : (change / instrument.previousClose) * 100
  return { change, percent }
}

export function holdingMetrics(holding: Holding, price: number) {
  const marketValue = round2(holding.quantity * price)
  const costBasis = round2(holding.quantity * holding.averagePrice)
  const unrealizedPnl = round2(marketValue - costBasis)
  const returnPercent = costBasis === 0 ? 0 : (unrealizedPnl / costBasis) * 100
  return { marketValue, costBasis, unrealizedPnl, returnPercent }
}

interface AffordabilityCheck {
  side: OrderSide
  quantity: number
  unitPrice: number
  cash: number
  sellable: number
}

/** Shared by the order form schema and the order engine so both enforce the same rule. */
export function checkAffordability({ side, quantity, unitPrice, cash, sellable }: AffordabilityCheck) {
  if (side === 'sell') {
    if (quantity <= sellable) return null
    return sellable > 0
      ? `You can sell at most ${sellable} shares (pending sells are reserved).`
      : 'You have no shares available to sell.'
  }
  const { net } = orderEstimate('buy', quantity, unitPrice)
  return net > cash
    ? `This order needs ${formatCurrency(net)} including fees; ${formatCurrency(cash)} is available.`
    : null
}

export function alertTargetError(direction: AlertDirection, target: number, price: number) {
  if (direction === 'above' && target <= price) {
    return `Target must be above the current price (${formatCurrency(price)}).`
  }
  if (direction === 'below' && target >= price) {
    return `Target must be below the current price (${formatCurrency(price)}).`
  }
  return null
}

export function portfolioSummary(state: AppState) {
  const rows = state.holdings.flatMap((holding) => {
    const instrument = state.instruments.find((i) => i.symbol === holding.symbol)
    if (!instrument) return []
    const metrics = holdingMetrics(holding, instrument.price)
    const dayPnl = round2(holding.quantity * (instrument.price - instrument.previousClose))
    return [{ holding, instrument, dayPnl, ...metrics }]
  })
  const marketValue = round2(rows.reduce((sum, r) => sum + r.marketValue, 0))
  const totalValue = round2(state.cash + marketValue)
  const dayPnl = round2(rows.reduce((sum, r) => sum + r.dayPnl, 0))
  const unrealizedPnl = round2(rows.reduce((sum, r) => sum + r.unrealizedPnl, 0))
  const realizedPnl = round2(state.transactions.reduce((sum, t) => sum + (t.realizedPnl ?? 0), 0))
  const totalReturn = round2(totalValue - STARTING_CAPITAL)
  const previousValue = totalValue - dayPnl
  return {
    rows,
    marketValue,
    totalValue,
    dayPnl,
    dayPnlPercent: previousValue === 0 ? 0 : (dayPnl / previousValue) * 100,
    unrealizedPnl,
    realizedPnl,
    totalReturn,
    totalReturnPercent: (totalReturn / STARTING_CAPITAL) * 100,
  }
}

/** Equal-weight index of all instruments, rebased to 100 at the start of the window. */
export function marketHistory(state: AppState, days = 30) {
  const anchor = new Date(SIMULATION_ANCHOR_ISO)
  return Array.from({ length: days }, (_, i) => {
    const offset = days - 1 - i
    const levels = state.instruments.map((instrument) => {
      const closes = instrument.history
      const base = closes[closes.length - days] ?? closes[0] ?? 1
      const close = closes[closes.length - 1 - offset] ?? base
      return base === 0 ? 100 : (close / base) * 100
    })
    const average = levels.length === 0 ? 100 : levels.reduce((sum, level) => sum + level, 0) / levels.length
    return { date: format(subDays(anchor, offset), 'MMM d'), value: round2(average) }
  })
}

/** Current holdings and cash valued at past closes (not a record of past balances). */
export function portfolioHistory(state: AppState, days = 30) {
  const anchor = new Date(SIMULATION_ANCHOR_ISO)
  return Array.from({ length: days }, (_, i) => {
    const offset = days - 1 - i
    const holdingsValue = state.holdings.reduce((sum, h) => {
      const history = state.instruments.find((x) => x.symbol === h.symbol)?.history ?? []
      return sum + h.quantity * (history[history.length - 1 - offset] ?? 0)
    }, 0)
    return { date: format(subDays(anchor, offset), 'MMM d'), value: round2(state.cash + holdingsValue) }
  })
}
