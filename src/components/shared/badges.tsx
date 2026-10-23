import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import type { OrderSide, OrderStatus } from '@/types/trading'

const tone = {
  gain: 'bg-gain/15 text-gain',
  loss: 'bg-loss/15 text-loss',
  warning: 'bg-warning/15 text-warning',
  primary: 'bg-primary/15 text-primary',
  neutral: 'bg-muted text-muted-foreground',
}

const statusTone: Record<OrderStatus | 'settled', string> = {
  pending: tone.warning,
  filled: tone.gain,
  settled: tone.gain,
  cancelled: tone.neutral,
}

export function StatusBadge({ status }: { status: OrderStatus | 'settled' }) {
  return <Badge variant="secondary" className={cn('capitalize', statusTone[status])}>{status}</Badge>
}

export function SideBadge({ side }: { side: OrderSide }) {
  return <Badge variant="secondary" className={side === 'buy' ? tone.gain : tone.loss}>{side === 'buy' ? 'Buy' : 'Sell'}</Badge>
}

export function SeverityBadge({ severity }: { severity: 'info' | 'warning' }) {
  return <Badge variant="secondary" className={severity === 'warning' ? tone.warning : tone.primary}>{severity === 'warning' ? 'Warning' : 'Info'}</Badge>
}
