import { useCallback, useEffect, useRef, useState } from 'react'
import { cn } from '../../utils/cn'

export function Segmented<T extends string | number>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: string }[]
  value: T
  onChange: (value: T) => void
  label: string
  className?: string
}) {
  const [focusedIndex, setFocusedIndex] = useState<number | null>(null)
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([])

  const activeIndex = options.findIndex((option) => option.value === value)

  useEffect(() => {
    if (activeIndex >= 0 && (focusedIndex === null || focusedIndex !== activeIndex)) {
      setFocusedIndex(activeIndex)
    }
  }, [options, value, activeIndex, focusedIndex])

  const moveFocus = useCallback(
    (delta: number) => {
      const len = options.length
      if (len === 0) return
      const current = focusedIndex ?? activeIndex
      const next = (((current + delta) % len) + len) % len
      setFocusedIndex(next)
      buttonRefs.current[next]?.focus()
    },
    [options, focusedIndex, activeIndex],
  )

  const onKeyDown = useCallback(
    (event: React.KeyboardEvent) => {
      if (event.key === 'ArrowRight' || event.key === 'ArrowDown') {
        event.preventDefault()
        moveFocus(1)
      } else if (event.key === 'ArrowLeft' || event.key === 'ArrowUp') {
        event.preventDefault()
        moveFocus(-1)
      } else if (event.key === 'Home') {
        event.preventDefault()
        moveFocus(-(focusedIndex ?? 0))
      } else if (event.key === 'End') {
        event.preventDefault()
        moveFocus(options.length - 1 - (focusedIndex ?? 0))
      }
    },
    [options, focusedIndex, moveFocus],
  )

  return (
    <div
      role="radiogroup"
      aria-label={label}
      onKeyDown={onKeyDown}
      className={cn(
        'grid auto-cols-fr grid-flow-col gap-1 rounded-md hairline bg-card p-1',
        className,
      )}
    >
      {options.map((option, index) => {
        const active = option.value === value
        const focused = focusedIndex === index
        return (
          <button
            key={String(option.value)}
            ref={(el) => {
              buttonRefs.current[index] = el
            }}
            type="button"
            role="radio"
            aria-checked={active}
            tabIndex={focused || active ? 0 : -1}
            onClick={() => {
              setFocusedIndex(index)
              onChange(option.value)
            }}
            className={cn(
              'min-h-9 rounded-sm px-3 text-sm font-semibold transition-colors duration-200 cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light',
              active ? 'bg-gold text-bg' : 'text-text-muted hover:text-text',
            )}
          >
            {option.label}
          </button>
        )
      })}
    </div>
  )
}
