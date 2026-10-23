import { format } from 'date-fns'

const currency = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' })
const compactCurrency = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  notation: 'compact',
  maximumFractionDigits: 1,
})
const quantity = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })
const compact = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 })

export const formatCurrency = (value: number) => currency.format(value)
export const formatCompactCurrency = (value: number) => compactCurrency.format(value)
export const formatQuantity = (value: number) => quantity.format(value)
export const formatVolume = (value: number) => compact.format(value)

export function formatPercent(value: number, withSign = false) {
  const sign = withSign && value > 0 ? '+' : ''
  return `${sign}${value.toFixed(2)}%`
}

export function formatSignedCurrency(value: number) {
  return `${value > 0 ? '+' : ''}${currency.format(value)}`
}

export const formatDateTime = (iso: string) => format(new Date(iso), 'MMM d, yyyy HH:mm')
export const formatDate = (iso: string) => format(new Date(iso), 'MMM d, yyyy')
