import { seedInstruments, seedLimitOrder, seedTrades, seedWatchlist } from '@/data/seed'
import { placeOrder } from '@/lib/order-engine'
import { STARTING_CAPITAL } from '@/lib/trading'
import type { AppState, UserPreferences } from '@/types/trading'

const defaultPreferences: UserPreferences = {
  displayName: 'Musaazmat Musani',
  email: 'musaniazmat@gmail.com',
  theme: 'light',
  notifyOrders: true,
  notifyAlerts: true,
  confirmOrders: false,
  currency: 'USD',
}

/** Starting portfolio built by replaying seed trades through the real order engine. */
export function createInitialState(): AppState {
  const empty: AppState = {
    instruments: seedInstruments,
    cash: STARTING_CAPITAL,
    holdings: [],
    orders: [],
    transactions: [],
    watchlist: seedWatchlist,
    alerts: [],
    notifications: [],
    preferences: defaultPreferences,
    tick: 0,
    marketOpen: true,
  }

  const withTrades = seedTrades.reduce(
    (state, trade) =>
      placeOrder(
        state,
        { symbol: trade.symbol, side: 'buy', type: 'market', quantity: trade.quantity },
        trade.at,
        trade.price,
      ),
    empty,
  )
  const { at, ...limitOrder } = seedLimitOrder
  const withPending = placeOrder(withTrades, limitOrder, at)

  return {
    ...withPending,
    notifications: [
      {
        id: 'ntf-welcome',
        kind: 'system',
        severity: 'info',
        title: 'Welcome to the TradePilot environment',
        message: 'All prices, orders and balances are demo data. No real trades are placed.',
        createdAt: '2026-10-19T08:00:00.000Z',
        read: false,
      },
      ...withPending.notifications.map((n) => ({ ...n, read: true })),
    ],
  }
}
