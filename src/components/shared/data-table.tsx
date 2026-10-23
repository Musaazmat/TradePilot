import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
} from '@tanstack/react-table'
import { AlertCircle, ArrowDown, ArrowUp, ChevronsUpDown, RotateCw } from 'lucide-react'
import { useState, type ReactNode } from 'react'

import { Button } from '@/components/ui/button'
import { Empty, EmptyContent, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from '@/components/ui/empty'
import { Pagination, PaginationContent, PaginationItem, PaginationNext, PaginationPrevious } from '@/components/ui/pagination'
import { Skeleton } from '@/components/ui/skeleton'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { cn } from '@/lib/utils'

interface DataTableProps<T> {
  data: T[]
  columns: ColumnDef<T>[]
  numericColumns?: string[]
  initialSorting?: SortingState
  pageSize?: number
  isLoading?: boolean
  error?: Error | string | null
  onRetry?: () => void
  skeletonRows?: number
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  onRowClick?: (row: T) => void
  getRowId?: (row: T) => string
}

function ariaSort(direction: false | 'asc' | 'desc') {
  if (direction === 'asc') return 'ascending'
  if (direction === 'desc') return 'descending'
  return 'none'
}

const skeletonWidths = ['w-20', 'w-28', 'w-14', 'w-24', 'w-16']

export function DataTable<T>({
  data,
  columns,
  numericColumns = [],
  initialSorting = [],
  pageSize = 10,
  isLoading = false,
  error = null,
  onRetry,
  skeletonRows = 5,
  emptyTitle = 'No records',
  emptyDescription,
  emptyAction,
  onRowClick,
  getRowId,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>(initialSorting)
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize })
  const table = useReactTable({
    data,
    columns,
    state: { sorting, pagination },
    onSortingChange: setSorting,
    onPaginationChange: setPagination,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getRowId,
  })
  const pageCount = table.getPageCount()
  const columnCount = table.getVisibleLeafColumns().length
  const isPopulated = !isLoading && !error && data.length > 0

  const renderBody = () => {
    if (isLoading) {
      return Array.from({ length: skeletonRows }, (_, rowIndex) => (
        <TableRow key={rowIndex} className="hover:bg-transparent">
          {table.getVisibleLeafColumns().map((column, columnIndex) => (
            <TableCell key={column.id}>
              {rowIndex === 0 && columnIndex === 0 && <span role="status" className="sr-only">Loading</span>}
              <Skeleton className={cn('h-4', skeletonWidths[(rowIndex + columnIndex) % skeletonWidths.length], numericColumns.includes(column.id) && 'ml-auto')} />
            </TableCell>
          ))}
        </TableRow>
      ))
    }
    if (error) {
      return (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={columnCount}>
            <Empty className="border-0 p-6" role="alert">
              <EmptyHeader>
                <EmptyMedia variant="icon"><AlertCircle className="text-destructive" aria-hidden /></EmptyMedia>
                <EmptyTitle>Couldn’t load data</EmptyTitle>
                <EmptyDescription>{typeof error === 'string' ? error : error.message}</EmptyDescription>
              </EmptyHeader>
              {onRetry && (
                <EmptyContent>
                  <Button variant="outline" size="sm" onClick={onRetry}><RotateCw aria-hidden /> Retry</Button>
                </EmptyContent>
              )}
            </Empty>
          </TableCell>
        </TableRow>
      )
    }
    if (data.length === 0) {
      return (
        <TableRow className="hover:bg-transparent">
          <TableCell colSpan={columnCount}>
            <Empty className="border-0 p-6">
              <EmptyHeader>
                <EmptyTitle>{emptyTitle}</EmptyTitle>
                {emptyDescription && <EmptyDescription>{emptyDescription}</EmptyDescription>}
              </EmptyHeader>
              {emptyAction && <EmptyContent>{emptyAction}</EmptyContent>}
            </Empty>
          </TableCell>
        </TableRow>
      )
    }
    return table.getRowModel().rows.map((row) => (
      <TableRow key={row.id} onClick={onRowClick ? () => onRowClick(row.original) : undefined} className={cn(onRowClick && 'cursor-pointer')}>
        {row.getVisibleCells().map((cell) => (
          <TableCell key={cell.id} className={cn(numericColumns.includes(cell.column.id) && 'text-right tabular-nums')}>
            {flexRender(cell.column.columnDef.cell, cell.getContext())}
          </TableCell>
        ))}
      </TableRow>
    ))
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="bg-card overflow-hidden rounded-lg border" aria-busy={isLoading}>
        <Table className={cn((isLoading || isPopulated) && 'min-w-[640px]')}>
          <TableHeader>
            {table.getHeaderGroups().map((group) => (
              <TableRow key={group.id} className="hover:bg-transparent">
                {group.headers.map((header) => {
                  const direction = header.column.getIsSorted()
                  const SortIcon = direction === 'asc' ? ArrowUp : direction === 'desc' ? ArrowDown : ChevronsUpDown
                  const label = flexRender(header.column.columnDef.header, header.getContext())
                  const numeric = numericColumns.includes(header.column.id)
                  return (
                    <TableHead key={header.id} aria-sort={ariaSort(direction)} className={cn('text-muted-foreground text-xs', numeric && 'text-right')}>
                      {header.column.getCanSort() ? (
                        <Button variant="ghost" size="xs" className={cn('text-muted-foreground -mx-2', numeric && 'flex-row-reverse')} onClick={header.column.getToggleSortingHandler()}>
                          {label}
                          <SortIcon aria-hidden />
                        </Button>
                      ) : (
                        label
                      )}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>{renderBody()}</TableBody>
        </Table>
      </div>
      {isPopulated && pageCount > 1 && (
        <div className="flex items-center justify-between gap-3 text-xs">
          <span className="text-muted-foreground">
            Page {pagination.pageIndex + 1} of {pageCount} · {data.length} rows
          </span>
          <Pagination className="mx-0 w-auto">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious href="#" aria-disabled={!table.getCanPreviousPage()} className={cn(!table.getCanPreviousPage() && 'pointer-events-none opacity-50')} onClick={(e) => { e.preventDefault(); table.previousPage() }} />
              </PaginationItem>
              <PaginationItem>
                <PaginationNext href="#" aria-disabled={!table.getCanNextPage()} className={cn(!table.getCanNextPage() && 'pointer-events-none opacity-50')} onClick={(e) => { e.preventDefault(); table.nextPage() }} />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        </div>
      )}
    </div>
  )
}
