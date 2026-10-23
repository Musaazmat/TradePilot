import type { ColumnDef } from '@tanstack/react-table'
import { Plus, Star } from 'lucide-react'
import { useState } from 'react'
import { Link } from 'react-router'

import { Sparkline } from '@/components/charts/sparkline'
import { DataTable } from '@/components/shared/data-table'
import { PageHeading } from '@/components/shared/page-heading'
import { PriceChange } from '@/components/shared/price-change'
import { SearchInput } from '@/components/shared/search-input'
import { Button, buttonVariants } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { formatCurrency } from '@/lib/format'
import { dayChange } from '@/lib/trading'
import { urls } from '@/routes/urls'
import { useAppState } from '@/state/app-state'
import type { Instrument } from '@/types/trading'

export function WatchlistPage() {
  const { state, dispatch } = useAppState()
  const [query, setQuery] = useState('')

  const watched = state.instruments.filter((i) => state.watchlist.includes(i.symbol))
  const term = query.trim().toLowerCase()
  const candidates = term
    ? state.instruments.filter((i) => !state.watchlist.includes(i.symbol) && (i.symbol.toLowerCase().includes(term) || i.name.toLowerCase().includes(term)))
    : []
  const columns: ColumnDef<Instrument>[] = [
    {
      id: 'symbol',
      accessorFn: (instrument) => instrument.symbol,
      header: 'Instrument',
      cell: ({ row }) => (
        <Link to={`${urls.trading}?symbol=${row.original.symbol}`} className="flex flex-col">
          <span className="font-medium hover:underline">{row.original.symbol}</span>
          <span className="text-muted-foreground text-xs">{row.original.name}</span>
        </Link>
      ),
    },
    {
      id: 'price',
      accessorFn: (instrument) => instrument.price,
      header: 'Price',
      cell: ({ row }) => formatCurrency(row.original.price),
    },
    {
      id: 'percent',
      accessorFn: (instrument) => dayChange(instrument).percent,
      header: '24h change',
      cell: ({ row }) => <PriceChange percent={dayChange(row.original).percent} />,
    },
    {
      id: 'trend',
      header: 'Trend · 30d',
      enableSorting: false,
      cell: ({ row }) => <Sparkline values={row.original.history.slice(-30)} />,
    },
    {
      id: 'watch',
      header: 'Action',
      enableSorting: false,
      cell: ({ row }) => (
        <div className='flex items-center'>
          <Link to={`${urls.trading}?symbol=${row.original.symbol}`} className={buttonVariants({ variant: 'outline', size: 'sm' })}>
          Trade
        </Link>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label={`Remove ${row.original.symbol} from watchlist`}
              onClick={() => dispatch({ type: 'watchlist_toggled', symbol: row.original.symbol })}
            >
              <Star className="fill-warning text-warning" aria-hidden />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Remove from watchlist</TooltipContent>
        </Tooltip>
        </div>
      ),
    },
  ]

  return (
    <>
      <PageHeading title="Watchlist" description="Track your favorite instruments and monitor market movements." />
      <div className="mb-4 max-w-sm">
        <SearchInput value={query} onChange={setQuery} placeholder="Search to add an instrument" />
        {term && (
          <ul className="bg-card mt-1 rounded-md border">
            {candidates.length === 0 ? (
              <li className="text-muted-foreground px-3 py-2 text-sm">No instruments to add for “{query}”.</li>
            ) : (
              candidates.map((i) => (
                <li key={i.symbol} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span><span className="font-medium">{i.symbol}</span> <span className="text-muted-foreground text-xs">{i.name}</span></span>
                  <Button size="sm" variant="outline" onClick={() => { dispatch({ type: 'watchlist_toggled', symbol: i.symbol }); setQuery('') }} aria-label={`Add ${i.symbol} to watchlist`}>
                    <Plus aria-hidden /> Add
                  </Button>
                </li>
              ))
            )}
          </ul>
        )}
      </div>

      <DataTable
        data={watched}
        columns={columns}
        numericColumns={['price', 'percent']}
        getRowId={(instrument) => instrument.symbol}
        emptyTitle="Your watchlist is empty"
        emptyDescription="Search above to add instruments, or star them in the market overview."
      />
    </>
  )
}
