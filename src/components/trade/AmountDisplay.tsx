import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'
import { TokenIcon } from '../ui/TokenIcon'

export interface AmountPill {
  label: string
  /** String written into the amount when tapped. Empty means unavailable. */
  value: string
  active: boolean
}

/** Large read-only amount (the keypad edits it) with quick-pick chips underneath. */
export function AmountDisplay({
  value,
  prefix,
  suffix,
  symbol,
  pills,
  onPill,
  error,
  extra,
}: {
  value: string
  prefix?: string
  suffix?: string
  symbol: string
  pills: AmountPill[]
  onPill: (value: string) => void
  error?: string | null
  /** Optional control rendered next to the token, e.g. a g ⇄ oz switch. */
  extra?: ReactNode
}) {
  const shown = value === '' ? '0' : value
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center justify-between gap-3">
        <p
          className={cn(
            'min-w-0 flex-1 truncate font-bold tabular-nums tracking-tight',
            shown.length > 9 ? 'text-3xl' : 'text-4xl',
            value === '' ? 'text-text-dim' : 'text-text',
          )}
        >
          {prefix}
          {shown}
          {suffix ? (
            <span className="ml-2 text-xl font-semibold text-text-muted">{suffix}</span>
          ) : null}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          {extra}
          <TokenIcon symbol={symbol} size={28} />
        </div>
      </div>
      <div className="grid grid-cols-4 gap-2">
        {pills.map((pill) => (
          <button
            key={pill.label}
            type="button"
            aria-pressed={pill.active}
            disabled={pill.value === ''}
            onClick={() => onPill(pill.value)}
            className={cn(
              'min-h-9 rounded-md text-sm font-semibold whitespace-nowrap transition-colors duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light disabled:cursor-not-allowed disabled:opacity-40',
              pill.active ? 'bg-gold text-bg' : 'bg-card-elevated text-text-soft hover:text-text',
            )}
          >
            {pill.label}
          </button>
        ))}
      </div>
      {error ? (
        <p role="alert" className="text-sm font-medium text-danger">
          {error}
        </p>
      ) : null}
    </div>
  )
}
