import type {
  AlertInput,
  AppState,
  Holding,
  Notification,
  Order,
  OrderInput,
  OrderStatus,
  OrderType,
  Transaction,
} from '@/types/trading'

import { hashString, mulberry32 } from './random'
import { alertTargetError, calculateFee, checkAffordability, round2 } from './trading'

const nextId = (prefix: string, items: readonly unknown[]) =>
  `${prefix}-${String(items.length + 1).padStart(4, '0')}`

export function availableToSell(state: AppState, symbol: string) {
  const held = state.holdings.find((h) => h.symbol === symbol)?.quantity ?? 0
  const reserved = state.orders
    .filter((o) => o.status === 'pending' && o.side === 'sell' && o.symbol === symbol)
    .reduce((sum, o) => sum + o.quantity, 0)
  return held - reserved
}

/** A market order always executes; a limit order executes when the price crosses its limit. */
export function isMarketable(
  side: OrderInput['side'],
  type: OrderType,
  limitPrice: number | null | undefined,
  price: number,
) {
  if (type === 'market') return true
  if (limitPrice == null) return false
  return side === 'buy' ? price <= limitPrice : price >= limitPrice
}

export const MARKET_CLOSED_MESSAGE = 'The simulated market is closed. Reopen it to place orders.'

export function validateOrder(state: AppState, input: OrderInput, quotePrice?: number): string | null {
  if (!state.marketOpen) return MARKET_CLOSED_MESSAGE
  const instrument = state.instruments.find((i) => i.symbol === input.symbol)
  if (!instrument) return 'Select a valid instrument.'
  if (!Number.isInteger(input.quantity) || input.quantity <= 0) {
    return 'Quantity must be a positive whole number.'
  }
  if (input.type === 'limit' && !(input.limitPrice !== undefined && input.limitPrice > 0)) {
    return 'A limit order needs a positive limit price.'
  }
  const price = quotePrice ?? instrument.price
  const immediate = isMarketable(input.side, input.type, input.limitPrice, price)
  return checkAffordability({
    side: input.side,
    quantity: input.quantity,
    unitPrice: immediate ? price : (input.limitPrice ?? price),
    cash: state.cash,
    sellable: availableToSell(state, input.symbol),
  })
}

function notify(
  state: AppState,
  kind: Notification['kind'],
  title: string,
  message: string,
  now: string,
  severity: Notification['severity'] = 'info',
): AppState {
  const allowed =
    (kind === 'order' && state.preferences.notifyOrders) ||
    (kind === 'alert' && state.preferences.notifyAlerts) ||
    kind === 'system'
  if (!allowed) return state
  const notification: Notification = {
    id: nextId('ntf', state.notifications),
    kind,
    severity,
    title,
    message,
    createdAt: now,
    read: false,
  }
  return { ...state, notifications: [notification, ...state.notifications] }
}

function updateOrder(
  state: AppState,
  orderId: string,
  status: OrderStatus,
  now: string,
  note: string,
  transactionId: string | null = null,
): AppState {
  return {
    ...state,
    orders: state.orders.map((o) =>
      o.id === orderId
        ? {
            ...o,
            status,
            updatedAt: now,
            transactionId,
            statusHistory: [...o.statusHistory, { status, at: now, note }],
          }
        : o,
    ),
  }
}

function fillOrder(state: AppState, orderId: string, price: number, now: string): AppState {
  const order = state.orders.find((o) => o.id === orderId)
  if (!order || order.status !== 'pending') return state

  const gross = round2(order.quantity * price)
  const fee = calculateFee(gross)
  const holding = state.holdings.find((h) => h.symbol === order.symbol)
  const rejected = (reason: string) =>
    notify(
      updateOrder(state, orderId, 'cancelled', now, reason),
      'order',
      `${order.symbol} order cancelled`,
      reason,
      now,
      'warning',
    )

  let cash: number
  let holdings: Holding[]
  let realizedPnl: number | null

  if (order.side === 'buy') {
    const total = round2(gross + fee)
    if (total > state.cash) return rejected('Cancelled: insufficient cash at execution.')
    const heldQty = holding?.quantity ?? 0
    const quantity = heldQty + order.quantity
    const averagePrice = round2((heldQty * (holding?.averagePrice ?? 0) + total) / quantity)
    cash = round2(state.cash - total)
    holdings = holding
      ? state.holdings.map((h) => (h.symbol === order.symbol ? { ...h, quantity, averagePrice } : h))
      : [...state.holdings, { symbol: order.symbol, quantity, averagePrice }]
    realizedPnl = null
  } else {
    if (!holding || holding.quantity < order.quantity) {
      return rejected('Cancelled: insufficient holdings at execution.')
    }
    cash = round2(state.cash + gross - fee)
    realizedPnl = round2(gross - fee - order.quantity * holding.averagePrice)
    const remaining = holding.quantity - order.quantity
    holdings =
      remaining === 0
        ? state.holdings.filter((h) => h.symbol !== order.symbol)
        : state.holdings.map((h) => (h.symbol === order.symbol ? { ...h, quantity: remaining } : h))
  }

  const transaction: Transaction = {
    id: nextId('txn', state.transactions),
    orderId,
    symbol: order.symbol,
    side: order.side,
    orderType: order.type,
    requestedQuantity: order.quantity,
    executedQuantity: order.quantity,
    executionPrice: price,
    fee,
    value: gross,
    realizedPnl,
    executedAt: now,
    status: 'settled',
  }

  const filled = updateOrder(
    { ...state, cash, holdings, transactions: [transaction, ...state.transactions] },
    orderId,
    'filled',
    now,
    `Filled ${order.quantity} @ ${price.toFixed(2)}`,
    transaction.id,
  )
  return notify(
    filled,
    'order',
    `${order.side === 'buy' ? 'Buy' : 'Sell'} ${order.symbol} filled`,
    `${order.quantity} shares at ${price.toFixed(2)}, fee ${fee.toFixed(2)}.`,
    now,
  )
}

/** `quotePrice` lets seed data replay historic prices; the UI never passes it. */
export function placeOrder(state: AppState, input: OrderInput, now: string, quotePrice?: number): AppState {
  const instrument = state.instruments.find((i) => i.symbol === input.symbol)
  if (!instrument || validateOrder(state, input, quotePrice) !== null) return state

  const price = quotePrice ?? instrument.price
  const order: Order = {
    id: nextId('ord', state.orders),
    symbol: input.symbol,
    side: input.side,
    type: input.type,
    quantity: input.quantity,
    limitPrice: input.type === 'limit' ? (input.limitPrice ?? null) : null,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
    transactionId: null,
    statusHistory: [{ status: 'pending', at: now, note: 'Order accepted' }],
  }
  const withOrder = { ...state, orders: [order, ...state.orders] }
  return isMarketable(order.side, order.type, order.limitPrice, price)
    ? fillOrder(withOrder, order.id, price, now)
    : withOrder
}

export function cancelOrder(state: AppState, orderId: string, now: string): AppState {
  const order = state.orders.find((o) => o.id === orderId)
  if (!order || order.status !== 'pending') return state
  return notify(
    updateOrder(state, orderId, 'cancelled', now, 'Cancelled by user'),
    'order',
    `${order.symbol} order cancelled`,
    `Pending ${order.side} order for ${order.quantity} shares was cancelled.`,
    now,
  )
}

export function processPendingOrders(state: AppState, now: string): AppState {
  if (!state.marketOpen) return state
  const pendingOldestFirst = state.orders.filter((o) => o.status === 'pending').reverse()
  return pendingOldestFirst.reduce((current, order) => {
    const instrument = current.instruments.find((i) => i.symbol === order.symbol)
    if (!instrument || !isMarketable(order.side, order.type, order.limitPrice, instrument.price)) {
      return current
    }
    return fillOrder(current, order.id, instrument.price, now)
  }, state)
}

export function validateAlert(state: AppState, input: AlertInput): string | null {
  const instrument = state.instruments.find((i) => i.symbol === input.symbol)
  if (!instrument) return 'Select a valid instrument.'
  if (!(input.targetPrice > 0)) return 'Target price must be greater than zero.'
  return alertTargetError(input.direction, input.targetPrice, instrument.price)
}

export function addAlert(state: AppState, input: AlertInput, now: string): AppState {
  if (validateAlert(state, input) !== null) return state
  return {
    ...state,
    alerts: [
      {
        id: nextId('alt', state.alerts),
        ...input,
        status: 'active',
        createdAt: now,
        triggeredAt: null,
      },
      ...state.alerts,
    ],
  }
}

export function evaluateAlerts(state: AppState, now: string): AppState {
  return state.alerts.reduce((current, alert) => {
    if (alert.status !== 'active') return current
    const price = current.instruments.find((i) => i.symbol === alert.symbol)?.price
    if (price === undefined) return current
    const hit = alert.direction === 'above' ? price >= alert.targetPrice : price <= alert.targetPrice
    if (!hit) return current
    const triggered = {
      ...current,
      alerts: current.alerts.map((a) =>
        a.id === alert.id ? { ...a, status: 'triggered' as const, triggeredAt: now } : a,
      ),
    }
    return notify(
      triggered,
      'alert',
      `${alert.symbol} alert triggered`,
      `Simulated price ${price.toFixed(2)} is ${alert.direction} your target of ${alert.targetPrice.toFixed(2)}.`,
      now,
      'warning',
    )
  }, state)
}

/** Deterministic simulated price step (about ±1.5%), then fills pending orders and checks alerts. */
export function advancePrices(state: AppState, now: string): AppState {
  if (!state.marketOpen) return state
  const tick = state.tick + 1
  const instruments = state.instruments.map((instrument) => {
    const random = mulberry32(hashString(instrument.symbol) + tick * 7919)()
    const price = round2(Math.max(0.01, instrument.price * (1 + (random - 0.5) * 0.03)))
    return { ...instrument, price, history: [...instrument.history.slice(0, -1), price] }
  })
  return evaluateAlerts(processPendingOrders({ ...state, instruments, tick }, now), now)
}
