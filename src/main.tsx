
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { RouterProvider } from 'react-router'

import './index.css'

import { ThemedToaster } from '@/app/themed-toaster'
import { router } from '@/routes/router'
import { AppStateProvider } from '@/state/app-state'
import { ThemeSync } from './app/theme-sync'

createRoot(document.getElementById('root')!).render(

   <StrictMode>
    <AppStateProvider>
      <ThemeSync />
      <RouterProvider router={router} />
      <ThemedToaster />
    </AppStateProvider>
  </StrictMode>,
)
