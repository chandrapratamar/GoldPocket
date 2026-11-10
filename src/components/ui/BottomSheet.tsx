import { useEffect, useRef, type ReactNode } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

const FOCUSABLE_SELECTOR =
  'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'

export function BottomSheet({
  open,
  onClose,
  title,
  dismissible = true,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  /** Set false while an action is in flight so the sheet can't be swiped or tapped away. */
  dismissible?: boolean
  children: ReactNode
}) {
  const panelRef = useRef<HTMLDivElement>(null)
  const previousFocus = useRef<HTMLElement | null>(null)
  const wasOpen = useRef(false)

  useEffect(() => {
    const previousOverflow = document.body.style.overflow

    if (open && !wasOpen.current) {
      previousFocus.current = document.activeElement as HTMLElement | null
      document.body.style.overflow = 'hidden'
      panelRef.current?.focus()
      wasOpen.current = true
    }

    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && dismissible) onClose()
      if (event.key === 'Tab') {
        const focusables = Array.from(
          panelRef.current?.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR) ?? [],
        )
        if (focusables.length === 0) return
        const first = focusables[0]
        const last = focusables[focusables.length - 1]
        if (event.shiftKey) {
          if (document.activeElement === first) {
            event.preventDefault()
            last.focus()
          }
        } else if (
          document.activeElement === last ||
          !panelRef.current?.contains(document.activeElement)
        ) {
          event.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)

    return () => {
      window.removeEventListener('keydown', onKey)
      if (!open && wasOpen.current) {
        document.body.style.overflow = previousOverflow
        previousFocus.current?.focus()
        wasOpen.current = false
      }
    }
  }, [open, dismissible, onClose])

  if (!open) return null

  // Rendered in a portal so it always sits above the bottom navigation.
  return createPortal(
    <div className="fixed inset-0 z-50 flex items-end justify-center">
      <div
        className="backdrop-enter absolute inset-0 bg-black/70"
        onClick={dismissible ? onClose : undefined}
        aria-hidden
      />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        tabIndex={-1}
        className="sheet-enter pb-safe relative max-h-[92dvh] w-full max-w-md overflow-y-auto rounded-t-[1.5rem] hairline border-b-0 bg-card-elevated px-4 pt-3 outline-none"
      >
        <div className="mx-auto mb-3 h-1 w-10 rounded-full bg-white/20" aria-hidden />
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-xl font-bold tracking-tight text-text">{title}</h2>
          {dismissible ? (
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-2 grid size-11 place-items-center rounded-md text-text-muted hover:text-text cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light"
            >
              <X className="size-5" aria-hidden />
            </button>
          ) : null}
        </div>
        {children}
      </div>
    </div>,
    document.body,
  )
}
