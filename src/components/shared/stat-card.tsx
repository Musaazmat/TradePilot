import type { ReactNode } from 'react'

import { Card, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { cn } from '@/lib/utils'

interface StatCardProps {
  label: string
  value: string
  sub?: ReactNode
  valueClassName?: string
}

export function StatCard({ label, value, sub, valueClassName }: StatCardProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className={cn('text-xl font-semibold tracking-tight tabular-nums group-data-[size=sm]/card:text-xl', valueClassName)}>{value}</CardTitle>
        {sub && <div className="text-muted-foreground text-xs">{sub}</div>}
      </CardHeader>
    </Card>
  )
}
