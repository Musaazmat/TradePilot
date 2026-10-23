import { CandlestickChart, ChevronsUpDown, Moon, Settings, Sun } from 'lucide-react'
import { Link, useLocation } from 'react-router'

import { DropdownMenu, DropdownMenuContent, DropdownMenuLabel, DropdownMenuRadioGroup, DropdownMenuRadioItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuItem } from '@/components/ui/dropdown-menu'
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { useAppState } from '@/state/app-state'
import type { ThemePreference } from '@/types/trading'

import { primaryNav, secondaryNav, type NavItem } from '@/routes/nav-items'
import { urls } from '@/routes/urls'

function NavGroup({ label, items }: { label: string; items: NavItem[] }) {
  const { pathname } = useLocation()
  const { state } = useAppState()
  const { isMobile, setOpenMobile } = useSidebar()
  const unread = state.notifications.filter((n) => !n.read).length

  return (
    <SidebarGroup>
      <SidebarGroupLabel>{label}</SidebarGroupLabel>
      <SidebarGroupContent>
        <SidebarMenu>
          {items.map((item) => {
            const active = pathname === item.to || pathname.startsWith(`${item.to}/`)
            return (
              <SidebarMenuItem key={item.id}>
                <SidebarMenuButton asChild isActive={active} tooltip={item.label}>
                  <Link to={item.to} aria-current={active ? 'page' : undefined} onClick={() => isMobile && setOpenMobile(false)}>
                    <item.icon aria-hidden />
                    <span>{item.label}</span>
                  </Link>
                </SidebarMenuButton>
                {item.to === urls.notifications && unread > 0 && <SidebarMenuBadge>{unread}</SidebarMenuBadge>}
              </SidebarMenuItem>
            )
          })}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export function AppSidebar() {
  const { state, dispatch } = useAppState()
  const { displayName, email, theme } = state.preferences

  return (
    <Sidebar collapsible="icon">
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" asChild>

              <Link to={urls.dashboard} className="flex items-center gap-2">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-sm bg-gray-200/80 dark:bg-slate-500/20 text-black/80 dark:text-white">
                  <CandlestickChart className="size-4.5" aria-hidden />
                </div>

                <div className="grid flex-1 text-left text-xl leading-tight">
                  <span className="truncate font-semibold">TradePilot</span>
                  {/* <span className="text-muted-foreground truncate text-xs">
                    Simulated Trading Platform
                  </span> */}
                </div>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <NavGroup label="Trading" items={primaryNav} />
        <NavGroup label="Account" items={secondaryNav} />
      </SidebarContent>
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton size="lg" tooltip={displayName} aria-label="Account menu">
                  <div className="bg-muted flex size-8 items-center justify-center rounded-md text-xs font-medium">
                    {displayName
                      .split(" ")
                      .map(word => word.charAt(0).toUpperCase())
                      .join("")
                      .slice(0, 2)
                    }
                    {/* {displayName.slice(0, 2).toUpperCase()} */}
                  </div>
                  <div className="grid flex-1 text-left text-sm leading-tight">
                    <span className="truncate font-medium">{displayName}</span>
                    <span className="text-muted-foreground truncate text-xs">{email}</span>
                  </div>
                  <ChevronsUpDown className="ml-auto size-4" aria-hidden />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="top" align="start" className="w-56">
                <DropdownMenuLabel>Theme</DropdownMenuLabel>
                <DropdownMenuRadioGroup value={theme} onValueChange={(value) => dispatch({ type: 'preferences_updated', changes: { theme: value as ThemePreference } })}>
                  <DropdownMenuRadioItem value="light"><Sun aria-hidden /> Light</DropdownMenuRadioItem>
                  <DropdownMenuRadioItem value="dark"><Moon aria-hidden /> Dark</DropdownMenuRadioItem>
                </DropdownMenuRadioGroup>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link to={urls.settings}><Settings aria-hidden /> Settings</Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
      <SidebarRail />
    </Sidebar>
  )
}
