# TradePilot —  trading platform

A front-end React Developer Assessment project: a 10 screen trading platform that runs entirely on **simulated data**. There is no backend, no live market feed and no brokerage connection. Every price, order, balance and notification is demo data kept in the browser.

## 1. Overview and assessment scope

The scope is the ten assessment screens plus the technical requirements (routing, state, forms, charts, responsive layouts, light/dark themes, persistence). Nothing outside that scope is implemented.

## 2. Features and screens

| # | Screen | Route | What it does |
|---|---|---|---|
| 1 | Dashboard | `/dashboard` | Portfolio value, daily P&L and overall return; 30-day **Portfolio / Market index** chart; top movers; watchlist preview; recent transactions; Buy / Sell / Open market shortcuts |
| 2 | Market Overview | `/market` | Searchable, sortable instrument table with price, 24h change, hover-interactive sparklines, watchlist star and Trade link |
| 3 | Trading Terminal | `/trading?symbol=&side=` | Instrument header, candlestick chart with volume, 1D / 1W / 1M timeframes, market and limit order form, position summary |
| 4 | Orders | `/orders?status=&q=` | Orders table with Pending / Filled / Cancelled tabs and search, **New order** sheet (market and limit form with validation), row actions, details sheet, cancellation |
| 5 | Portfolio | `/portfolio` | Holdings, quantity, average price, current price, market value, unrealized P&L, return, allocation chart |
| 6 | Watchlist | `/watchlist` | Search-to-add, remove, price and change, sparklines, Trade links |
| 7 | Transactions | `/transactions?symbol=&side=&q=` | Executed trades with side, type, quantity, price, fee, value, timestamp and status; search, filters, sorting |
| 8 | Trade Details | `/transactions/:transactionId` | Summary, fill breakdown, fees, realized P&L and order status history |
| 9 | Notifications & Alerts | `/notifications` | Price alerts (above/below), order notifications with Info / Warning severity, read / unread controls |
| 10 | Settings | `/settings` | Profile, theme, notification preferences, order-confirmation setting, demo reset |

Unknown URLs render a not-found page; an unknown transaction ID renders an in-page not-found state.

## 3. Technology stack and prerequisites

Node.js and npm.

React 19 · Vite 8 · TypeScript 6 (strict) · Tailwind CSS 4 (`@tailwindcss/vite`) · React Router 7 · shadcn/ui (Vega style, Radix primitives, Lucide icons) · React Hook Form + Zod · Recharts 3 (via shadcn `ChartContainer`) · lightweight-charts 5 (candlesticks) · TanStack Table 8 · Sonner · date-fns.

## 4–7. Commands

```bash
npm install          # Install dependencies
npm run dev          # Start the development server
npm run build        # TypeScript build + Vite production build -> dist/
npm run preview      # Preview the production build
npm run lint         # Run ESLint
npx tsc --noEmit     # Run TypeScript type checking
```

## 8. Routes

See the table in section 2. `symbol` and `side` select the terminal's instrument and side; `status` and `q` filter orders; `symbol`, `side` and `q` filter transactions. Query parameters survive navigation and refresh.

## 9. Project structure

```
src/
  app/          theme-sync.tsx, themed-toaster.tsx
  routes/       urls.ts, router.tsx, nav-items.ts
  state/        reducer.ts, app-state.tsx, initial-state.ts, storage.ts 
  lib/          order-engine.ts, trading.ts, candles.ts, simulation.ts, css-color.ts, format.ts, random.ts, search-params.ts, utils.ts
  data/         seed.ts (deterministic mock data)
  types/        trading.ts (domain types)
  hooks/        use-mobile.ts (used by the shadcn sidebar)
  components/
    ui/         shadcn/ui components (generated, Vega)
    shared/     DataTable, Panel, StatCard, badges, empty/error states, confirm dialog, search input, segmented control
    layout/     app-layout, app-sidebar, app-header, breadcrumbs
    charts/     candlestick-chart.tsx, sparkline.tsx
  features/     dashboard, market, trading, orders, portfolio, watchlist, transactions, trade-details, notifications, settings
```

## 10. Feature-based architecture

Each screen lives in `src/features/<name>/` with its page component, and, where needed, its form schema (`order-schema.ts`, `alert-schema.ts`, `settings-schema.ts`) and form component. Pages read state with `useAppState()` and dispatch actions; they contain no trading rules. The Orders screen reuses the terminal's `OrderForm` (inside a Sheet) rather than duplicating it.

## 11. Components and shadcn/ui

`src/components/ui/` holds the installed shadcn components: alert, alert-dialog, badge, breadcrumb, button, card, chart, checkbox, dialog, dropdown-menu, empty, field, input, label, pagination, scroll-area, select, separator, sheet, sidebar, skeleton, sonner, switch, table, tabs, toggle, toggle-group, tooltip. Only these are installed. Forms use shadcn `Field` with React Hook Form.


`components/shared/DataTable` wraps TanStack Table and shadcn `Table` and provides sorting, client-side pagination (shown only when more than one page exists), row click, and loading / error / empty rendering (section 22).

## 12. Routing and sidebar navigation

- `src/routes/urls.ts` is the single source of truth for URLs (`urls.dashboard`, `urls.trading`, `urls.tradeDetails`, …).
- `src/routes/router.tsx` holds the route configuration (`routes`) and creates the router once; `main.tsx` passes the exported `router` to `RouterProvider`. One shared `AppLayout` (sidebar, header, `Outlet`) wraps every page.
- `src/routes/nav-items.ts` builds the sidebar from `urls`. The sidebar highlights an item when the current path equals its URL or starts with it, so Trade Details highlights Transactions.
- Dynamic routes use `.replace()`: `` urls['tradeDetails'].replace(':transactionId', transaction.id) ``. Query strings are appended to a static URL, e.g. `` `${urls.trading}?symbol=${symbol}&side=sell` ``.
- `VITE_HASH_ROUTER=true` switches `router.tsx` to a hash router. It is used only to produce the static single-file preview and is not needed for normal use.

## 13. State management and data flow

State is React Context + `useReducer`; there is no state library.

- `state/app-state.tsx` exposes `AppStateProvider` and `useAppState()` (`{ state, dispatch }`).
- `state/reducer.ts` routes actions (`order_placed`, `order_cancelled`, `prices_advanced`, `market_toggled`, `watchlist_toggled`, `alert_added`, `alert_removed`, `notification_read`, `notifications_read_all`, `preferences_updated`, `demo_reset`) to pure functions.
- All trading rules live in `lib/order-engine.ts`; calculations in `lib/trading.ts`. The reducer contains no rules.
- `AppState` holds instruments (prices and history), cash, holdings, orders, transactions, watchlist, alerts, notifications, preferences, the tick count and `marketOpen`. Every screen derives its figures from this one object, so screens stay synchronized. Component-local UI (dialogs, filters-in-progress, the chart timeframe) stays in `useState`.

Flow: UI event → validate (`validateOrder`) → `dispatch` → reducer → engine → new `AppState` → persisted to `localStorage` and re-rendered everywhere.

## 14. Market status and the simulation lifecycle

`marketOpen` is one boolean in `AppState`. It is a **simulation switch**.

- **Default:** open. The header shows a green **Market Open** badge with a restrained animated ping (disabled for reduced-motion users).
- **Timer:** `AppStateProvider` runs one `setInterval` (`TICK_INTERVAL_MS`, 4000 ms in `lib/simulation.ts`) that dispatches `prices_advanced`. The effect depends only on `state.marketOpen`: it exists while the market is open and is cleared on close or unmount, so there is never more than one timer.
- **Click the badge:** dispatches `market_toggled`. Closed shows a red **Market Closed** badge with no ping.
- **While closed:** `advancePrices` and `processPendingOrders` return the state unchanged (so no prices move and no pending order fills), `validateOrder` rejects any new order, the order form shows a notice and disables submission, and the manual **Simulate price update** button is disabled. Cash, holdings, pending orders and transactions are untouched, and pending orders can still be cancelled.
- **On reopen:** the timer restarts. The next tick evaluates pending orders; an order whose condition is met fills exactly once because only `pending` orders can fill.
- **Persistence:** `marketOpen` is saved with the rest of the state, so a closed market stays closed after reload. Saved data from before this setting existed loads as open.
- **Manual step:** the **Simulate price update** button applies one tick on demand while the market is open. It is a single-step control, separate from the open/closed switch.

## 15. Mock market data and price updates

`data/seed.ts` defines 8 fictional instruments with 90 days of closes generated by a seeded PRNG (`lib/random.ts`), so every load is identical. The starting portfolio and orders are built by replaying three seed buys and one pending limit order through the real order engine.

Each tick (`advancePrices`) moves every instrument by a deterministic step of about ±1.5%, derived from the symbol and the tick number, then fills eligible pending orders and checks price alerts. `previousClose` is fixed at the start, so daily change is measured against it.

## 16. Order execution rules

- **Market orders** execute immediately at the current simulated price (when the market is open).
- **Limit orders** execute immediately if marketable (buy: price ≤ limit, sell: price ≥ limit); otherwise they are stored as `pending`. A pending order fills only when a tick moves the simulated price across its limit; a timer firing alone never fills an order. Fills use the price at that moment.
- Orders cannot be filled or cancelled twice; filled and cancelled orders are final. A pending order that cannot be afforded at fill time is cancelled with a Warning notification.
- Pending sell quantity is reserved, so holdings cannot be oversold.

## 17. Validation, fees, transactions and P&L

- **Validation:** the order form uses React Hook Form + Zod (positive whole quantity; positive limit price for limit orders; cash and sellable-share checks). `order-engine.validateOrder` repeats the checks (and the market-open check) before any state change, so UI validation is never the only guard. Alerts validate that the target is on the correct side of the current price.
- **Fees:** 0.1% of gross value, minimum $1.00 (`calculateFee`). Buys cost gross + fee; sells return gross − fee.
- **Transactions:** each fill records quantity, execution price, fee, gross value, realized P&L (sells) and timestamp, and links back to its order.
- **P&L:** the average price includes buy fees. Unrealized P&L = market value − cost basis. Realized P&L on a sell = proceeds − fee − quantity × average price. Daily P&L is measured against `previousClose`. Overall return is measured against the $100,000 starting capital. Realized and unrealized are reported separately.

## 18. Charts

- **Candlesticks:** `lightweight-charts` in `components/charts/candlestick-chart.tsx`, with a volume histogram. `lib/candles.ts` builds illustrative OHLC candles from each instrument's daily closes: 1D uses 48 half-hour candles, 1W uses 40 candles, 1M uses 30 daily candles. Intraday paths are seeded and always end on the current simulated price. Changing the timeframe rebuilds the dataset and re-creates the chart.
- **Dashboard and portfolio:** Recharts through shadcn `ChartContainer`. The dashboard chart switches between portfolio value (current holdings and cash valued at past simulated closes — not a record of past balances) and an equal-weight market index rebased to 100.
- **Sparklines:** a small SVG component with hover readout.
- `lightweight-charts` cannot parse `oklch()`, so `lib/css-color.ts` resolves theme tokens to `rgba()` for it.

## 19. Theme configuration

`src/index.css` imports Tailwind, `tw-animate-css` and `shadcn/tailwind.css`, maps tokens in `@theme inline`, and defines semantic variables in OKLCH for `:root` and `.dark`. The values are the shadcn `neutral` theme with the green chart palette and a `0.625rem` radius. Three semantic tokens are added: `--gain` (green, from the chart palette), `--loss` (`--destructive`) and `--warning` (amber, which the preset has no equivalent for). There are no hex, rgb or hsl colours in app code.

The CLI merges the theme's variables into the `:root` and `.dark` blocks of `src/index.css`. After applying, check that `--gain`, `--loss` and `--warning` are still present (they are app tokens, not theme tokens), and review any fonts, radius or shadows the theme adds. Because components use only semantic tokens and the candlestick chart resolves colours at runtime, no component changes should be needed.

## 20. Light/dark mode and persistence

`preferences.theme` (`dark` | `light`) is part of the saved state. `app/theme-sync.tsx` toggles the `dark` class on `<html>` whenever it changes; the candlestick chart and Sonner toasts receive the theme explicitly. Theme can be changed in Settings or from the account menu in the sidebar footer. `index.html` starts with the `dark` class, so a user who saved the light theme may see a brief dark flash before the saved preference applies.

Typography uses Inter, following the shadcn/ui Vega style. The font is self-hosted via @fontsource-variable/inter, avoiding external font requests. Numerals use tabular-nums app-wide for consistent alignment.

## 21. localStorage persistence

The whole `AppState` is saved on every change under the key `meridian-trading-demo-v3` (`state/storage.ts`). On load it is parsed and structurally checked (types of cash, tick, `marketOpen`, instruments, holdings, orders, transactions, alerts, notifications, theme). Malformed JSON, the wrong shape or unavailable storage falls back to the seeded demo state without crashing (wrong-shape data is deleted; malformed JSON is overwritten by the next save). Data saved before `marketOpen` existed is loaded as open. **Settings → Reset demo** restores the seed.

## 22. Loading, empty, success and error states

- **DataTable** renders skeleton rows matching its columns (`isLoading`), an in-table error with an optional Retry button (`error`, `onRetry`) and an empty state (`emptyTitle`, `emptyDescription`, `emptyAction`) under the real header. This app has no API, so no page currently passes `isLoading` or `error`; the props are shaped to accept a query's state directly. All states are covered by `components/shared/data-table.test.tsx`.
- **Empty** states: watchlist, notifications, alerts, orders, transactions, holdings, no-search-results.
- **Success** feedback: Sonner toasts for orders, cancellations, alerts, settings and market status changes.
- **Error / not-found:** a route error page, a not-found page and an in-page not-found for unknown transaction IDs. The candlestick chart shows a skeleton while it mounts.

## 23. Build 

```bash
npm run build
```

## 24. Known limitations

- All data is simulated: no live market feed, no brokerage, no real orders.
- **Market Open / Closed is a simulation switch**, not market hours.
- Single fill per order; no partial fills or order book.
- No accounts, authentication or backend, so there are no real security settings.

---

## Architecture summary

- **Routing:** `routes/urls.ts` defines every URL; `routes/router.tsx` defines the routes and creates the one router; `routes/nav-items.ts` feeds the sidebar from `urls`. One shared layout wraps all pages.
- **Components:** screens in `features/<name>/`; reusable pieces in `components/shared`, `layout` and `charts`; shadcn/ui primitives in `components/ui`. Screens compose these and hold no trading rules.
- **State management:** a single `AppState` in a Context + `useReducer` provider, saved to `localStorage` and validated on load. Every screen reads and derives from it, which keeps cash, holdings, orders, transactions, notifications and P&L in sync.
- **Trading engine:** `lib/order-engine.ts` validates orders, executes fills (updating cash, holdings with fee-inclusive average price, the order's status history, a transaction and a notification), cancels pending orders and evaluates alerts. `lib/trading.ts` holds fee, P&L, portfolio and chart-series calculations.
- **Market simulation:** one provider-level timer advances deterministic prices every 4 seconds while `marketOpen` is true; each tick fills eligible pending orders and checks alerts. When closed, the timer is cleared and the engine ignores ticks and new orders, while balances and pending orders are preserved.
- **Charts:** lightweight-charts for candlesticks (OHLC and volume, 1D / 1W / 1M rebuilt from seeded data), Recharts via shadcn `ChartContainer` for the dashboard and allocation, and an SVG sparkline.
- **Theme:** shadcn semantic variables in OKLCH (`neutral` + green charts) defined in `src/index.css`, plus `--gain` / `--loss` / `--warning`. Light/dark is a persisted preference that toggles the `dark` class.