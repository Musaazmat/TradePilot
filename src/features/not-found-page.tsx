import { useEffect } from 'react'
import { Link } from 'react-router'

import { EmptyState } from '@/components/shared/empty-state'
import { urls } from '@/routes/urls'

export function NotFoundPage() {
  useEffect(() => {
    document.title = 'Page not found - TradePilot'
  }, [])

  return (
    <EmptyState
      title="Page not found"
      description="The address you opened does not match any screen."
      action={
        <Link to={urls.dashboard} className="text-primary text-sm hover:underline">
          Go to dashboard
        </Link>
      }
    />
  )
}
