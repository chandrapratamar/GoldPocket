import { useId, useState, type ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'
import { cn } from '../../utils/cn'

export function Disclosure({
  title,
  children,
  defaultOpen = false,
}: {
  title: string
  children: ReactNode
  defaultOpen?: boolean
}) {
  const [open, setOpen] = useState(defaultOpen)
  const panelId = useId()
  return (
    <div className="rounded-md hairline bg-card">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        className="flex min-h-12 w-full items-center justify-between gap-3 px-4 py-3 text-left text-sm font-semibold text-text cursor-pointer select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light rounded-md"
      >
        {title}
        <ChevronDown
          className={cn(
            'size-5 shrink-0 text-text-muted transition-transform duration-200',
            open && 'rotate-180',
          )}
          aria-hidden
        />
      </button>
      {open ? (
        <div id={panelId} className="px-4 pb-4 text-sm leading-relaxed text-text-muted">
          {children}
        </div>
      ) : null}
    </div>
  )
}
