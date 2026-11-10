import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import { DEFAULT_SLIPPAGE_PCT, SLIPPAGE_OPTIONS } from '../config/trade'
import type { GoldUnit } from '../types'

const STORAGE_KEY = 'gp.settings.v1'

interface Settings {
  unit: GoldUnit
  slippage: number
}

const defaults: Settings = { unit: 'g', slippage: DEFAULT_SLIPPAGE_PCT }

function load(): Settings {
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}') as Partial<Settings>
    return {
      unit: parsed.unit === 'oz' ? 'oz' : 'g',
      slippage: (SLIPPAGE_OPTIONS as readonly number[]).includes(parsed.slippage ?? -1)
        ? (parsed.slippage as number)
        : defaults.slippage,
    }
  } catch {
    return defaults
  }
}

const SettingsContext = createContext<
  | (Settings & {
      setUnit: (unit: GoldUnit) => void
      setSlippage: (slippage: number) => void
    })
  | null
>(null)

export function SettingsProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<Settings>(load)

  const update = useCallback((patch: Partial<Settings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...patch }
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      } catch {
        /* storage unavailable — keep in memory */
      }
      return next
    })
  }, [])

  const value = useMemo(
    () => ({
      ...settings,
      setUnit: (unit: GoldUnit) => update({ unit }),
      setSlippage: (slippage: number) => update({ slippage }),
    }),
    [settings, update],
  )

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>
}

export function useSettings() {
  const context = useContext(SettingsContext)
  if (!context) throw new Error('useSettings must be used within a SettingsProvider')
  return context
}
