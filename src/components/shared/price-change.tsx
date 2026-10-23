import { ArrowDownRight, ArrowUpRight } from 'lucide-react'

import { formatPercent, formatSignedCurrency } from '@/lib/format'
import { cn } from '@/lib/utils'

export const toneClass = (value: number) => (value > 0 ? 'text-gain' : value < 0 ? 'text-loss' : 'text-muted-foreground')

interface PriceChangeProps {
  change?: number
  percent: number
  className?: string
}

export function PriceChange({ change, percent, className }: PriceChangeProps) {
  const Icon = percent < 0 ? ArrowDownRight : ArrowUpRight
  return (
    <span className={cn('num inline-flex items-center gap-1', toneClass(percent), className)}>
      <Icon className="size-3.5" aria-hidden />
      {change !== undefined && <span>{formatSignedCurrency(change)}</span>}
      <span>{formatPercent(percent, true)}</span>
    </span>
  )
}
