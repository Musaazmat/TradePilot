import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react'

import { TICK_INTERVAL_MS } from '@/lib/simulation'
import type { AppState } from '@/types/trading'

import { createInitialState } from './initial-state'
import { reducer, type Action } from './reducer'
import { loadState, saveState } from './storage'

interface AppStateContextValue {
  state: AppState
  dispatch: Dispatch<Action>
}

const AppStateContext = createContext<AppStateContextValue | null>(null)

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, () => loadState() ?? createInitialState())

  useEffect(() => {
    saveState(state)
  }, [state])

  // The single simulation timer. It exists only while the market is open and is cleared on close/unmount.
  useEffect(() => {
    if (!state.marketOpen) return
    const timer = window.setInterval(() => dispatch({ type: 'prices_advanced', now: new Date().toISOString() }), TICK_INTERVAL_MS)
    return () => window.clearInterval(timer)
  }, [state.marketOpen])

  const value = useMemo(() => ({ state, dispatch }), [state])
  return <AppStateContext value={value}>{children}</AppStateContext>
}

export function useAppState() {
  const context = useContext(AppStateContext)
  if (!context) throw new Error('useAppState must be used inside AppStateProvider')
  return context
}
