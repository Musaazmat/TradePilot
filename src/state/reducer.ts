import {
  addAlert,
  advancePrices,
  cancelOrder,
  placeOrder,
} from '@/lib/order-engine'
import type { AlertInput, AppState, OrderInput, UserPreferences } from '@/types/trading'

import { createInitialState } from './initial-state'

export type Action =
  | { type: 'order_placed'; input: OrderInput; now: string }
  | { type: 'order_cancelled'; orderId: string; now: string }
  | { type: 'prices_advanced'; now: string }
  | { type: 'market_toggled' }
  | { type: 'watchlist_toggled'; symbol: string }
  | { type: 'alert_added'; input: AlertInput; now: string }
  | { type: 'alert_removed'; alertId: string }
  | { type: 'notification_read'; id: string }
  | { type: 'notifications_read_all' }
  | { type: 'preferences_updated'; changes: Partial<UserPreferences> }
  | { type: 'demo_reset' }

/** The reducer only routes actions; trading rules live in lib/order-engine. */
export function reducer(state: AppState, action: Action): AppState {
  switch (action.type) {
    case 'order_placed':
      return placeOrder(state, action.input, action.now)
    case 'order_cancelled':
      return cancelOrder(state, action.orderId, action.now)
    case 'prices_advanced':
      return advancePrices(state, action.now)
    case 'market_toggled':
      return { ...state, marketOpen: !state.marketOpen }
    case 'watchlist_toggled':
      return {
        ...state,
        watchlist: state.watchlist.includes(action.symbol)
          ? state.watchlist.filter((s) => s !== action.symbol)
          : [...state.watchlist, action.symbol],
      }
    case 'alert_added':
      return addAlert(state, action.input, action.now)
    case 'alert_removed':
      return { ...state, alerts: state.alerts.filter((a) => a.id !== action.alertId) }
    case 'notification_read':
      return {
        ...state,
        notifications: state.notifications.map((n) => (n.id === action.id ? { ...n, read: true } : n)),
      }
    case 'notifications_read_all':
      return { ...state, notifications: state.notifications.map((n) => ({ ...n, read: true })) }
    case 'preferences_updated':
      return { ...state, preferences: { ...state.preferences, ...action.changes } }
    case 'demo_reset':
      return createInitialState()
  }
}
