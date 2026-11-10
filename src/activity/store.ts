import { useSyncExternalStore } from 'react'
import type { TradeSide } from '../types'

const STORAGE_KEY = 'gp.activity.v1'
const MAX_RECORDS = 200

export interface ActivityRecord {
  id: string
  side: TradeSide
  usdt: number
  paxg: number
  priceUsd: number
  feesUsd: number
  slippagePct: number
  createdAt: string
  /** True while trades are simulated locally (no on-chain transaction exists). */
  simulated: boolean
  txHash?: string
  /** Which aggregator executed the swap. */
  provider?: 'lifi' | '1inch'
}

function load(): ActivityRecord[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '[]')
    return Array.isArray(parsed) ? (parsed as ActivityRecord[]) : []
  } catch {
    return []
  }
}

let records: ActivityRecord[] = load()
const listeners = new Set<() => void>()

function subscribe(listener: () => void) {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

function newId(): string {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`
}

export function addActivity(input: Omit<ActivityRecord, 'id' | 'createdAt'>): ActivityRecord {
  const record: ActivityRecord = { ...input, id: newId(), createdAt: new Date().toISOString() }
  records = [record, ...records].slice(0, MAX_RECORDS)
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records))
  } catch {
    /* storage unavailable — keep in memory */
  }
  listeners.forEach((listener) => listener())
  return record
}

export function clearActivity(): void {
  records = []
  try {
    localStorage.removeItem(STORAGE_KEY)
  } catch {
    /* storage unavailable */
  }
  listeners.forEach((listener) => listener())
}

export function useActivity(): ActivityRecord[] {
  return useSyncExternalStore(subscribe, () => records)
}

export function useActivityRecord(id: string | undefined): ActivityRecord | undefined {
  const all = useActivity()
  return id ? all.find((record) => record.id === id) : undefined
}
