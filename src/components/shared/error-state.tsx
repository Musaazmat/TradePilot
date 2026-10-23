import { AlertCircle } from 'lucide-react'
import type { ReactNode } from 'react'

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

export function ErrorState({ title, description, action }: { title: string; description?: string; action?: ReactNode }) {
  return (
    <Alert variant="destructive" className="max-w-xl">
      <AlertCircle />
      <AlertTitle>{title}</AlertTitle>
      {(description || action) && (
        <AlertDescription>
          {description}
          {action && <div className="mt-2">{action}</div>}
        </AlertDescription>
      )}
    </Alert>
  )
}
