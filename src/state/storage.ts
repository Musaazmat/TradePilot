import type { AppState } from '@/types/trading'

const STORAGE_KEY = 'tradepilot-trading-demo-v3'

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null

const arrayOf = (value: unknown, check: (item: unknown) => boolean) =>
  Array.isArray(value) && value.every(check)

const hasKeys = (item: unknown, strings: string[], numbers: string[]) =>
  isRecord(item) &&
  strings.every((k) => typeof item[k] === 'string') &&
  numbers.every((k) => typeof item[k] === 'number' && Number.isFinite(item[k]))

/** Structural check on saved data; anything unexpected falls back to the seeded demo. */
function isAppState(value: unknown): value is AppState {
  if (!isRecord(value)) return false
  const prefs = value.preferences
  return (
    typeof value.cash === 'number' &&
    Number.isFinite(value.cash) &&
    typeof value.tick === 'number' &&
    typeof value.marketOpen === 'boolean' &&
    arrayOf(value.instruments, (i) => hasKeys(i, ['symbol', 'name'], ['price', 'previousClose']) && isRecord(i) && Array.isArray(i.history)) &&
    arrayOf(value.holdings, (h) => hasKeys(h, ['symbol'], ['quantity', 'averagePrice'])) &&
    arrayOf(value.orders, (o) => hasKeys(o, ['id', 'symbol', 'side', 'type', 'status'], ['quantity']) && isRecord(o) && Array.isArray(o.statusHistory)) &&
    arrayOf(value.transactions, (t) => hasKeys(t, ['id', 'orderId', 'symbol'], ['executionPrice', 'fee', 'value'])) &&
    arrayOf(value.watchlist, (s) => typeof s === 'string') &&
    arrayOf(value.alerts, (a) => hasKeys(a, ['id', 'symbol', 'direction', 'status'], ['targetPrice'])) &&
    arrayOf(value.notifications, (n) => hasKeys(n, ['id', 'title', 'message'], []) && isRecord(n) && (n.severity === 'info' || n.severity === 'warning') && isRecord(n) && typeof n.read === 'boolean') &&
    isRecord(prefs) &&
    (prefs.theme === 'dark' || prefs.theme === 'light') &&
    typeof prefs.displayName === 'string' &&
    typeof prefs.confirmOrders === 'boolean'
  )
}

export function loadState(): AppState | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed: unknown = JSON.parse(raw)
    const candidate = isRecord(parsed) && parsed.marketOpen === undefined ? { ...parsed, marketOpen: true } : parsed
    if (isAppState(candidate)) return candidate
    localStorage.removeItem(STORAGE_KEY)
    return null
  } catch {
    return null
  }
}

export function saveState(state: AppState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    /* storage unavailable or full: the session keeps working in memory */
  }
}
