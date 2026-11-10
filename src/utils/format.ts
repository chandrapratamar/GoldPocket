import { GRAMS_PER_TROY_OUNCE } from '../config/units'
import type { GoldUnit } from '../types'

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
})

export function formatUsd(amount: number): string {
  return usdFormatter.format(amount)
}

/** Converts a PAXG amount (1 PAXG = 1 troy oz) to the number shown in the chosen unit. */
export function paxgToUnit(paxg: number, unit: GoldUnit): number {
  return unit === 'g' ? paxg * GRAMS_PER_TROY_OUNCE : paxg
}

export function unitToPaxg(value: number, unit: GoldUnit): number {
  return unit === 'g' ? value / GRAMS_PER_TROY_OUNCE : value
}

/** Decimals worth showing for a gold weight in the given unit. */
export function goldDecimals(value: number, unit: GoldUnit): number {
  if (unit === 'oz') return 4
  return value >= 10 ? 2 : 3
}

/** Number only, e.g. "1.512". */
export function formatGoldNumber(paxg: number, unit: GoldUnit): string {
  const value = paxgToUnit(paxg, unit)
  return value.toFixed(goldDecimals(value, unit))
}

/** Number plus unit, e.g. "1.512 g". */
export function formatGold(paxg: number, unit: GoldUnit): string {
  return `${formatGoldNumber(paxg, unit)} ${unit}`
}

export function formatPaxg(paxg: number): string {
  return `${paxg.toFixed(6)} PAXG`
}

/** Spot price per displayed unit (per gram or per troy ounce). */
export function pricePerUnit(pricePerOunce: number, unit: GoldUnit): number {
  return unit === 'g' ? pricePerOunce / GRAMS_PER_TROY_OUNCE : pricePerOunce
}

export function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString(undefined, {
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

export function dayLabel(iso: string): string {
  const date = new Date(iso)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' })
}

export function truncateAddress(address: string): string {
  return address.length <= 12 ? address : `${address.slice(0, 6)}…${address.slice(-4)}`
}

/** Floors to `decimals` and trims trailing zeros, e.g. 1.2000 → "1.2". Never rounds up. */
export function toInputString(value: number, decimals: number): string {
  if (!Number.isFinite(value) || value <= 0) return ''
  const factor = 10 ** decimals
  const floored = Math.floor(value * factor + 1e-9) / factor
  if (floored <= 0) return ''
  const fixed = floored.toFixed(decimals)
  return fixed.includes('.') ? fixed.replace(/\.?0+$/, '') : fixed
}
