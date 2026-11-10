import { ChevronDown } from 'lucide-react'
import { useEffect, useId, useRef, useState } from 'react'
import { cn } from '../../utils/cn'
import { formatUsd } from '../../utils/format'

export interface FeeRow {
  label: string
  value: string
}

/**
 * Collapsible fee breakdown. The compact variant renders the toggle and panel as
 * separate grid items, so it can sit inline next to the rate in a two-column grid.
 */
export function FeeSummary({
  totalFeesUsd,
  rows,
  compact = false,
}: {
  totalFeesUsd: number
  rows: FeeRow[]
  compact?: boolean
}) {
  const [open, setOpen] = useState(false)
  const panelId = useId()
  const panelRef = useRef<HTMLDivElement>(null)

  // When the details panel opens, scroll it into view so it isn't hidden behind
  // the pinned keypad / bottom navigation.
  useEffect(() => {
    if (open) {
      // Defer so the panel has rendered with its new height.
      const id = window.setTimeout(() => {
        panelRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
      }, 0)
      return () => window.clearTimeout(id)
    }
  }, [open])

  if (compact) {
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-controls={panelId}
          className="flex min-h-10 shrink-0 items-center gap-1 rounded-sm text-xs font-semibold text-text tabular-nums cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light"
        >
          <span className="font-normal text-text-muted">Fees</span>~{formatUsd(totalFeesUsd)}
          <ChevronDown
            className={cn(
              'size-4 text-text-muted transition-transform duration-200',
              open && 'rotate-180',
            )}
            aria-hidden
          />
        </button>
        <div
          id={panelId}
          hidden={!open}
          className="col-span-2 mt-1 space-y-1.5 pb-1"
          ref={panelRef}
        >
          {rows.map((row) => (
            <div key={row.label} className="flex justify-between gap-3 text-xs">
              <span className="text-text-muted">{row.label}</span>
              <span className="font-medium text-text tabular-nums">{row.value}</span>
            </div>
          ))}
        </div>
      </>
    )
  }

  return (
    <div>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-11 w-full items-center justify-between text-left cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light rounded-sm"
      >
        <span className="text-sm text-text-muted">Total fees</span>
        <span className="flex items-center gap-1 text-sm font-semibold text-text tabular-nums">
          ~{formatUsd(totalFeesUsd)}
          <ChevronDown
            className={cn(
              'size-5 text-text-muted transition-transform duration-200',
              open && 'rotate-180',
            )}
            aria-hidden
          />
        </span>
      </button>
      <div id={panelId} hidden={!open} className="mt-1 space-y-2 pb-1" ref={panelRef}>
        {rows.map((row) => (
          <div key={row.label} className="flex justify-between gap-3">
            <span className="text-sm text-text-muted">{row.label}</span>
            <span className="text-sm font-medium text-text tabular-nums">{row.value}</span>
          </div>
        ))}
      </div>
    </div>
  )
}
