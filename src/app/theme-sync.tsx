import { useEffect } from 'react'

import { useAppState } from '@/state/app-state'

/** Applies the persisted theme preference to the document root. */
export function ThemeSync() {
  const theme = useAppState().state.preferences.theme

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark')
  }, [theme])

  return null
}
