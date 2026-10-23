import { useEffect, type ReactNode } from 'react'

interface PageHeadingProps {
  title: string
  description?: string
  actions?: ReactNode
}

export function PageHeading({ title, description, actions }: PageHeadingProps) {
  useEffect(() => {
    document.title = `${title} - TradePilot`
  }, [title])

  return (
    <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
      <div>
        <h1 className="text-lg font-semibold tracking-tight">{title}</h1>
        {description && <p className="text-muted-foreground mt-0.5 text-sm">{description}</p>}
      </div>
      {actions}
    </div>
  )
}
