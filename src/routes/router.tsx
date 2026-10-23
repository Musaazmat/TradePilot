
import {
  Navigate,
  type RouteObject,
  createBrowserRouter,
  createHashRouter,
} from 'react-router'

import { AppLayout } from '@/components/layout/app-layout'
import { DashboardPage } from '@/features/dashboard/dashboard-page'
import { MarketPage } from '@/features/market/market-page'
import { NotFoundPage } from '@/features/not-found-page'
import { NotificationsPage } from '@/features/notifications/notifications-page'
import { OrdersPage } from '@/features/orders/orders-page'
import { PortfolioPage } from '@/features/portfolio/portfolio-page'
import { RouteErrorPage } from '@/features/route-error-page'
import { SettingsPage } from '@/features/settings/settings-page'
import { TradeDetailsPage } from '@/features/trade-details/trade-details-page'
import { TradingPage } from '@/features/trading/trading-page'
import { TransactionsPage } from '@/features/transactions/transactions-page'
import { WatchlistPage } from '@/features/watchlist/watchlist-page'
import { urls } from '@/routes/urls'

export { urls } from '@/routes/urls'

const routes: RouteObject[] = [
  {
    path: '/',
    element: <AppLayout />,
    errorElement: <RouteErrorPage />,
    children: [
      {
        index: true,
        element: <Navigate to={urls.dashboard} replace />,
      },
      {
        path: urls.dashboard,
        element: <DashboardPage />,
      },
      {
        path: urls.market,
        element: <MarketPage />,
      },
      {
        path: urls.trading,
        element: <TradingPage />,
      },
      {
        path: urls.orders,
        element: <OrdersPage />,
      },
      {
        path: urls.portfolio,
        element: <PortfolioPage />,
      },
      {
        path: urls.watchlist,
        element: <WatchlistPage />,
      },
      {
        path: urls.transactions,
        element: <TransactionsPage />,
      },
      {
        path: urls.tradeDetails,
        element: <TradeDetailsPage />,
      },
      {
        path: urls.notifications,
        element: <NotificationsPage />,
      },
      {
        path: urls.settings,
        element: <SettingsPage />,
      },
      {
        path: '*',
        element: <NotFoundPage />,
      },
    ],
  },
]

export const router =
  import.meta.env.VITE_HASH_ROUTER === 'true'
    ? createHashRouter(routes)
    : createBrowserRouter(routes)
