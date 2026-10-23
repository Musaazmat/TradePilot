import type { ColumnDef } from '@tanstack/react-table'
import { Star } from 'lucide-react'
import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router'

import { Sparkline } from '@/components/charts/sparkline'
import { DataTable } from '@/components/shared/data-table'
import { PageHeading } from '@/components/shared/page-heading'
import { PriceChange } from '@/components/shared/price-change'
import { SearchInput } from '@/components/shared/search-input'
import { Button, buttonVariants } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency } from '@/lib/format'
import { dayChange } from '@/lib/trading'
import { cn } from '@/lib/utils'
import { urls } from '@/routes/urls'
import { useAppState } from '@/state/app-state'
import type { Instrument } from '@/types/trading'

interface MarketRow extends Instrument {
  change: number
  percent: number
}

export function MarketPage() {
  const { state, dispatch } = useAppState()
  const navigate = useNavigate()
  const [query, setQuery] = useState('')

  const rows = useMemo<MarketRow[]>(() => {
    const term = query.trim().toLowerCase()
    return state.instruments
      .filter((i) => !term || i.symbol.toLowerCase().includes(term) || i.name.toLowerCase().includes(term))
      .map((i) => ({ ...i, ...dayChange(i) }))
  }, [state.instruments, query])

  const columns: ColumnDef<MarketRow>[] = [
    {
      id: 'symbol',
      accessorFn: (r) => r.symbol,
      header: 'Instrument',
      cell: ({ row }) => (
        <Link to={`${urls.trading}?symbol=${row.original.symbol}`} className="flex flex-col" onClick={(e) => e.stopPropagation()}>
          <span className="font-medium hover:underline">{row.original.symbol}</span>
          <span className="text-muted-foreground text-xs">{row.original.name}</span>
        </Link>
      ),
    },
    { id: 'price', accessorFn: (r) => r.price, header: 'Price', cell: ({ row }) => formatCurrency(row.original.price) },
    { id: 'percent', accessorFn: (r) => r.percent, header: '24h change', cell: ({ row }) => <PriceChange change={row.original.change} percent={row.original.percent} /> },
    { id: 'trend', header: 'Trend · 30d', enableSorting: false, cell: ({ row }) => <Sparkline values={row.original.history.slice(-30)} /> },
    {
      id: 'watch',
      header: 'Watch',
      enableSorting: false,
      cell: ({ row }) => {
        const watched = state.watchlist.includes(row.original.symbol)
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-pressed={watched}
                aria-label={`${watched ? 'Remove' : 'Add'} ${row.original.symbol} ${watched ? 'from' : 'to'} watchlist`}
                onClick={(e) => {
                  e.stopPropagation()
                  dispatch({ type: 'watchlist_toggled', symbol: row.original.symbol })
                }}
              >
                <Star className={cn(watched && 'fill-warning text-warning')} aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent>{watched ? 'Remove from watchlist' : 'Add to watchlist'}</TooltipContent>
          </Tooltip>
        )
      },
    },
    {
      id: 'trade',
      header: '',
      enableSorting: false,
      cell: ({ row }) => (
        <Link to={`${urls.trading}?symbol=${row.original.symbol}`} onClick={(e) => e.stopPropagation()} className={buttonVariants({ variant: 'outline', size: 'sm' })}>Trade</Link>
      ),
    },
  ]

  return (
    <>
      <PageHeading title="Market Overview" description="Monitor market prices, price changes, and instrument performance." />
      <SearchInput value={query} onChange={setQuery} placeholder="Search symbol or name" className="mb-3 max-w-xs" />
      <DataTable
        data={rows}
        columns={columns}
        numericColumns={['price', 'percent']}
        getRowId={(r) => r.symbol}
        onRowClick={(r) => navigate(`${urls.trading}?symbol=${r.symbol}`)}
        emptyTitle={state.instruments.length === 0 ? 'No instruments available' : 'No results'}
        emptyDescription={state.instruments.length === 0 ? undefined : `Nothing matches “${query}”.`}
      />
    </>
  )
}
