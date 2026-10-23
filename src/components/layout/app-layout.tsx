import { Outlet, useLocation } from 'react-router'

import { SidebarInset, SidebarProvider } from '@/components/ui/sidebar'
import { TooltipProvider } from '@/components/ui/tooltip'

import { AppHeader } from './app-header'
import { AppSidebar } from './app-sidebar'

export function AppLayout() {
  const { pathname } = useLocation()

  return (
    <TooltipProvider delayDuration={300}>
      <SidebarProvider className="h-svh min-h-0 overflow-hidden">
        <AppSidebar />
        <SidebarInset className="h-svh min-h-0 min-w-0 overflow-hidden">
          <AppHeader />
          <main key={pathname} className="min-h-0 min-w-0 flex-1 overflow-y-auto p-3 md:p-5">
            <Outlet />
          </main>
        </SidebarInset>
      </SidebarProvider>
    </TooltipProvider>
  )
}
