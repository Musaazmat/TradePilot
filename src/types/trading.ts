export type OrderSide = 'buy' | 'sell'
export type OrderType = 'market' | 'limit'
export type OrderStatus = 'pending' | 'filled' | 'cancelled'
export type Timeframe = '1D' | '1W' | '1M'
export type AlertDirection = 'above' | 'below'
export type ThemePreference = 'dark' | 'light'

export interface Instrument {
  symbol: string
  name: string
  sector: string
  /** last price. Never live market data. */
  price: number
  previousClose: number
  /** Deterministic daily closes, oldest first, ending at `price`. */
  history: number[]
  avgVolume: number
}

export interface Holding {
  symbol: string
  quantity: number
  averagePrice: number
}

export interface Order {
  id: string
  symbol: string
  side: OrderSide
  type: OrderType
  quantity: number
  limitPrice: number | null
  status: OrderStatus
  createdAt: string
  updatedAt: string
  transactionId: string | null
  statusHistory: { status: OrderStatus; at: string; note: string }[]
}

export interface Transaction {
  id: string
  orderId: string
  symbol: string
  side: OrderSide
  orderType: OrderType
  requestedQuantity: number
  executedQuantity: number
  executionPrice: number
  fee: number
  /** Gross value before fees. */
  value: number
  realizedPnl: number | null
  executedAt: string
  status: 'settled'
}

export interface PriceAlert {
  id: string
  symbol: string
  targetPrice: number
  direction: AlertDirection
  status: 'active' | 'triggered'
  createdAt: string
  triggeredAt: string | null
}

export interface Notification {
  id: string
  kind: 'order' | 'alert' | 'system'
  severity: 'info' | 'warning'
  title: string
  message: string
  createdAt: string
  read: boolean
}

export interface UserPreferences {
  displayName: string
  email: string
  theme: ThemePreference
  notifyOrders: boolean
  notifyAlerts: boolean
  /** Ask for a confirmation step before an order is submitted. */
  confirmOrders: boolean
  currency: 'USD'
}

export interface OrderInput {
  symbol: string
  side: OrderSide
  type: OrderType
  quantity: number
  limitPrice?: number
}

export interface AlertInput {
  symbol: string
  direction: AlertDirection
  targetPrice: number
}

export interface Candle {
  time: import('lightweight-charts').UTCTimestamp
  open: number
  high: number
  low: number
  close: number
  volume: number
}

export interface AppState {
  instruments: Instrument[]
  cash: number
  holdings: Holding[]
  orders: Order[]
  transactions: Transaction[]
  watchlist: string[]
  alerts: PriceAlert[]
  notifications: Notification[]
  preferences: UserPreferences
  /** Number of price updates applied so far. */
  tick: number
  /** Simulation switch, not a real exchange calendar: when false, prices and executions are paused. */
  marketOpen: boolean
}
