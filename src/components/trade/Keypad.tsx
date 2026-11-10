import { useEffect } from 'react'
import { Delete } from 'lucide-react'
import { haptic } from '../../utils/haptics'

const KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', 'back'] as const
const MAX_LENGTH = 12

/** Pure input rules: one dot, no stray leading zeros, capped decimals and length. */
export function applyKey(value: string, key: string, maxDecimals: number): string {
  if (key === 'back') return value.slice(0, -1)
  if (key === '.') {
    if (maxDecimals === 0 || value.includes('.')) return value
    return value === '' ? '0.' : `${value}.`
  }
  if (!/^[0-9]$/.test(key)) return value
  if (value.length >= MAX_LENGTH) return value
  const [, decimals = ''] = value.split('.')
  if (value.includes('.') && decimals.length >= maxDecimals) return value
  if (value === '0') return key
  return value + key
}

export function Keypad({
  value,
  onChange,
  maxDecimals,
  enabled = true,
}: {
  value: string
  onChange: (value: string) => void
  maxDecimals: number
  /** Also listen to a hardware keyboard (handy when testing on desktop). */
  enabled?: boolean
}) {
  useEffect(() => {
    if (!enabled) return
    const onKey = (event: KeyboardEvent) => {
      const target = event.target as HTMLElement | null
      if (target && /^(INPUT|TEXTAREA|SELECT)$/.test(target.tagName)) return
      if (event.metaKey || event.ctrlKey || event.altKey) return
      const key = event.key === ',' ? '.' : event.key === 'Backspace' ? 'back' : event.key
      if (key === 'back' || key === '.' || /^[0-9]$/.test(key)) {
        onChange(applyKey(value, key, maxDecimals))
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [enabled, value, onChange, maxDecimals])

  return (
    <div className="grid grid-cols-3 gap-1" role="group" aria-label="Number pad">
      {KEYS.map((key) => (
        <button
          key={key}
          type="button"
          aria-label={key === 'back' ? 'Backspace' : key === '.' ? 'Decimal point' : key}
          disabled={key === '.' && maxDecimals === 0}
          onClick={() => {
            haptic(8)
            onChange(applyKey(value, key, maxDecimals))
          }}
          className="grid min-h-10 place-items-center rounded-md text-xl font-semibold text-text transition-colors duration-100 select-none cursor-pointer active:bg-card-elevated focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light disabled:opacity-30"
        >
          {key === 'back' ? <Delete className="size-5" aria-hidden /> : key}
        </button>
      ))}
    </div>
  )
}
