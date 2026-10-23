import type { ReactNode } from 'react'

import { Card, CardAction, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

interface PanelProps {
  title?: string
  actions?: ReactNode
  className?: string
  children: ReactNode
}

/** Titled card section used across screens */
export function Panel({ title, actions, className, children }: PanelProps) {
  return (
    <Card size="sm" className={className}>
      {title && (
        <CardHeader className="border-b">
          <CardTitle className="text-sm font-medium">{title}</CardTitle>
          {actions && <CardAction>{actions}</CardAction>}
        </CardHeader>
      )}
      <CardContent>{children}</CardContent>
    </Card>
  )
}
