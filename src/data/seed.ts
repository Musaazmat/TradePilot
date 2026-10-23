import { mulberry32 } from '@/lib/random'
import type { Instrument } from '@/types/trading'

function buildHistory(seed: number, endPrice: number, days: number, volatility: number) {
  const rand = mulberry32(seed)
  const steps = Array.from({ length: days }, () => (rand() - 0.48) * volatility)
  const raw = steps.reduce<number[]>((acc, step) => {
    const last = acc[acc.length - 1] ?? 1
    return [...acc, last * (1 + step)]
  }, [])
  const scale = endPrice / (raw[raw.length - 1] ?? 1)
  return raw.map((v) => Math.round(v * scale * 100) / 100)
}

interface InstrumentSeed {
  symbol: string
  name: string
  sector: string
  price: number
  volatility: number
  avgVolume: number
}

const instrumentSeeds: InstrumentSeed[] = [
  { symbol: 'NVTX', name: 'Novatrix Systems', sector: 'Technology', price: 482.15, volatility: 0.028, avgVolume: 18_400_000 },
  { symbol: 'AURM', name: 'Aurum Materials', sector: 'Materials', price: 64.32, volatility: 0.018, avgVolume: 6_200_000 },
  { symbol: 'HLXB', name: 'Helix Biologics', sector: 'Healthcare', price: 131.7, volatility: 0.024, avgVolume: 4_900_000 },
  { symbol: 'QNTA', name: 'Quanta Logistics', sector: 'Industrials', price: 89.45, volatility: 0.016, avgVolume: 7_300_000 },
  { symbol: 'BRLN', name: 'Berlin Capital Group', sector: 'Financials', price: 212.8, volatility: 0.014, avgVolume: 5_100_000 },
  { symbol: 'SOLR', name: 'Solara Energy', sector: 'Energy', price: 38.9, volatility: 0.03, avgVolume: 12_800_000 },
  { symbol: 'PXLR', name: 'Pixelar Media', sector: 'Communication', price: 154.25, volatility: 0.022, avgVolume: 9_600_000 },
  { symbol: 'CRBN', name: 'Carbon Retail Co.', sector: 'Consumer', price: 47.6, volatility: 0.015, avgVolume: 8_100_000 },
]

export const SEED_HISTORY_DAYS = 90

export const seedInstruments: Instrument[] = instrumentSeeds.map((s, index) => {
  const history = buildHistory(1000 + index * 17, s.price, SEED_HISTORY_DAYS, s.volatility)
  return {
    symbol: s.symbol,
    name: s.name,
    sector: s.sector,
    price: s.price,
    previousClose: history[history.length - 2] ?? s.price,
    history,
    avgVolume: s.avgVolume,
  }
})

/** Fixed "now" for the simulation so charts and history never depend on the wall clock. */
export const SIMULATION_ANCHOR_ISO = '2026-10-19T20:00:00.000Z'

export const seedWatchlist = ['HLXB', 'SOLR', 'PXLR']

/** Historic buys replayed through the order engine to build the starting portfolio. */
export const seedTrades = [
  { symbol: 'AURM', quantity: 150, price: 58.1, at: '2026-10-12T14:35:00.000Z' },
  { symbol: 'BRLN', quantity: 60, price: 198.5, at: '2026-10-13T15:10:00.000Z' },
  { symbol: 'NVTX', quantity: 40, price: 441.2, at: '2026-10-14T16:05:00.000Z' },
]

export const seedLimitOrder = {
  symbol: 'QNTA',
  side: 'buy',
  type: 'limit',
  quantity: 50,
  limitPrice: 82,
  at: '2026-10-18T10:20:00.000Z',
} as const
