import {
  Bell,
  CandlestickChart,
  ClipboardList,
  Eye,
  LayoutDashboard,
  LineChart,
  PieChart,
  Receipt,
  Settings,
  type LucideIcon,
} from 'lucide-react'

import { urls } from '@/routes/urls'

export interface NavItem {
  id: Exclude<keyof typeof urls, 'tradeDetails'>
  label: string
  to: string
  icon: LucideIcon
}

export const primaryNav: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', to: urls.dashboard, icon: LayoutDashboard },
  { id: 'market', label: 'Market', to: urls.market, icon: LineChart },
  { id: 'trading', label: 'Trading Terminal', to: urls.trading, icon: CandlestickChart },
  { id: 'orders', label: 'Orders', to: urls.orders, icon: ClipboardList },
  { id: 'portfolio', label: 'Portfolio', to: urls.portfolio, icon: PieChart },
  { id: 'watchlist', label: 'Watchlist', to: urls.watchlist, icon: Eye },
  { id: 'transactions', label: 'Transactions', to: urls.transactions, icon: Receipt },
]

export const secondaryNav: NavItem[] = [
  { id: 'notifications', label: 'Notifications', to: urls.notifications, icon: Bell },
  { id: 'settings', label: 'Settings', to: urls.settings, icon: Settings },
]

export const allNav: NavItem[] = [...primaryNav, ...secondaryNav]
