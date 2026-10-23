import { useEffect } from 'react'
import { Link, useRouteError } from 'react-router'

import { ErrorState } from '@/components/shared/error-state'
import { urls } from '@/routes/urls'

export function RouteErrorPage() {
  const error = useRouteError()

  useEffect(() => {
    document.title = 'Error - TradePilot'
  }, [])

  return (
    <div className="p-6">
      <ErrorState
        title="Something went wrong"
        description={error instanceof Error ? error.message : 'An unexpected error occurred.'}
        action={<Link to={urls.dashboard} className="text-primary text-sm hover:underline">Back to dashboard</Link>}
      />
    </div>
  )
}
