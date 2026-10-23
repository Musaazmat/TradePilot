import { Bell } from 'lucide-react'
import { Link } from 'react-router'
import { toast } from 'sonner'

import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'
import { urls } from '@/routes/urls'
import { useAppState } from '@/state/app-state'

import { AppBreadcrumbs } from './breadcrumbs'

export function AppHeader() {
  const { state, dispatch } = useAppState()
  const { marketOpen } = state
  const unread = state.notifications.filter((n) => !n.read).length

  const toggleMarket = () => {
    dispatch({ type: 'market_toggled' })
    toast.message(marketOpen ? 'Simulated market closed' : 'Simulated market open', {
      description: marketOpen
        ? 'Price updates and executions are paused. Pending orders and balances are kept.'
        : 'Simulated price updates have resumed.',
    })
  }

  // const stepPrices = () => {
  //   dispatch({ type: 'prices_advanced', now: new Date().toISOString() })
  //   toast.message(`Simulated price update #${state.tick + 1} applied`, {
  //     description: 'Pending limit orders and price alerts were re-evaluated.',
  //   })
  // }

  return (
    <header className="bg-card flex h-12 shrink-0 items-center gap-2 border-b px-3 md:px-4">
      <SidebarTrigger className="-ml-1" />
      <Separator orientation="vertical" className="mr-1 my-3" />
      <div className="hidden min-w-0 lg:block"><AppBreadcrumbs /></div>
      <Badge variant="outline" className="text-warning border-warning/40 ml-1">
        <span className="sm:hidden">Simulated</span>
        <span className="hidden sm:inline">Simulated data</span>
      </Badge>

      <div className="ml-auto flex items-center gap-1.5 text-sm sm:gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              aria-pressed={marketOpen}
              aria-label={marketOpen ? 'Simulated market open. Click to close it and pause price updates.' : 'Simulated market closed. Click to reopen it and resume price updates.'}
              onClick={toggleMarket}
              className="focus-visible:ring-ring/50 rounded-full outline-none focus-visible:ring-3"
            >
              <Badge variant="outline" className={cn('h-7 gap-1.5 px-2.5', marketOpen ? 'border-gain/40 bg-gain/10 text-gain' : 'border-loss/40 bg-loss/10 text-loss')}>
                <span className="relative flex size-2" aria-hidden>
                  {marketOpen && <span className="bg-gain absolute inline-flex size-full animate-ping rounded-full opacity-60 motion-reduce:animate-none" />}
                  <span className={cn('relative inline-flex size-2 rounded-full', marketOpen ? 'bg-gain' : 'bg-loss')} />
                </span>
                <span className="sm:hidden">{marketOpen ? 'Open' : 'Closed'}</span>
                <span className="hidden sm:inline">{marketOpen ? 'Market Open' : 'Market Closed'}</span>
              </Badge>
            </button>
          </TooltipTrigger>
          <TooltipContent className="max-w-56">
            Simulation switch, not a live exchange. {marketOpen ? 'Click to pause price updates and executions.' : 'Click to resume price updates.'}
          </TooltipContent>
        </Tooltip>
        {/* <Tooltip>
          <TooltipTrigger asChild>
            <Button size="sm" variant="outline" disabled={!marketOpen} onClick={stepPrices} aria-label="Simulate price update">
              <RefreshCw aria-hidden />
              <span className="hidden xl:inline">Simulate price update</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>{marketOpen ? 'Apply one simulated price step now' : 'Reopen the market to update prices'}</TooltipContent>
        </Tooltip> */}
        <span className="text-muted-foreground hidden lg:inline">
          Cash <span className="text-foreground tabular-nums">{formatCurrency(state.cash)}</span>
        </span>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button asChild size="icon-sm" variant="ghost" className="relative">
              <Link to={urls.notifications} aria-label={`Notifications, ${unread} unread`}>
                <Bell aria-hidden />
                {unread > 0 && <span className="bg-primary absolute top-1 right-1 size-2 rounded-full" />}
              </Link>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Notifications</TooltipContent>
        </Tooltip>
      </div>
    </header>
  )
}
