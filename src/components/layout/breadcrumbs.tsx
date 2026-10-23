import { Fragment } from 'react'
import { Link, useLocation } from 'react-router'

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb'
import { allNav } from '@/routes/nav-items'
import { urls } from '@/routes/urls'


interface Crumb {
  label: string
  to?: string
}

function crumbsFor(pathname: string): Crumb[] {
  const [first, second] = pathname.split('/').filter(Boolean)
  const section = allNav.find((item) => item.to === `/${first}`)
  if (!section) return [{ label: 'Not found' }]
  if (first === 'transactions' && second) {
    return [{ label: section.label, to: urls.transactions }, { label: decodeURIComponent(second) }]
  }
  return [{ label: section.label }]
}

export function AppBreadcrumbs() {
  const crumbs = crumbsFor(useLocation().pathname)
  return (
    <Breadcrumb>
      <BreadcrumbList>
        {crumbs.map((crumb, index) => (
          <Fragment key={crumb.label}>
            {index > 0 && <BreadcrumbSeparator />}
            <BreadcrumbItem>
              {crumb.to ? (
                <BreadcrumbLink asChild>
                  <Link to={crumb.to}>{crumb.label}</Link>
                </BreadcrumbLink>
              ) : (
                <BreadcrumbPage>{crumb.label}</BreadcrumbPage>
              )}
            </BreadcrumbItem>
          </Fragment>
        ))}
      </BreadcrumbList>
    </Breadcrumb>
  )
}
