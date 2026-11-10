import { useRef, useState, type PointerEvent } from 'react'
import { ChevronsRight } from 'lucide-react'
import { cn } from '../../utils/cn'
import { haptic } from '../../utils/haptics'

/** Drag the thumb to the end to confirm. Keyboard / screen-reader activation also confirms. */
export function SwipeToConfirm({
  label,
  onConfirm,
  disabled = false,
}: {
  label: string
  onConfirm: () => void
  disabled?: boolean
}) {
  const trackRef = useRef<HTMLDivElement>(null)
  const thumbRef = useRef<HTMLButtonElement>(null)
  const dragStart = useRef<number | null>(null)
  const [x, setX] = useState(0)
  const [dragging, setDragging] = useState(false)
  const [done, setDone] = useState(false)

  // Measured from the DOM so the control follows the scaled type ramp.
  const maxX = () => {
    const track = trackRef.current
    const thumb = thumbRef.current
    if (!track || !thumb) return 0
    return Math.max(0, track.clientWidth - thumb.offsetWidth - thumb.offsetLeft * 2)
  }

  const confirm = () => {
    if (done || disabled) return
    setDone(true)
    setX(maxX())
    haptic([15, 40, 15])
    onConfirm()
  }

  const onPointerDown = (event: PointerEvent<HTMLButtonElement>) => {
    if (disabled || done) return
    event.currentTarget.setPointerCapture(event.pointerId)
    dragStart.current = event.clientX - x
    setDragging(true)
  }

  const onPointerMove = (event: PointerEvent<HTMLButtonElement>) => {
    if (dragStart.current === null) return
    setX(Math.min(maxX(), Math.max(0, event.clientX - dragStart.current)))
  }

  const onPointerEnd = () => {
    if (dragStart.current === null) return
    dragStart.current = null
    setDragging(false)
    if (maxX() > 0 && x >= maxX() * 0.85) confirm()
    else setX(0)
  }

  const progress = maxX() > 0 ? x / maxX() : 0

  return (
    <div
      ref={trackRef}
      className={cn(
        'relative h-16 select-none overflow-hidden rounded-full hairline-gold bg-card',
        disabled && 'opacity-50',
      )}
    >
      <span
        className="pointer-events-none absolute inset-0 grid place-items-center pl-14 text-base font-semibold text-gold-accent"
        style={{ opacity: 1 - progress }}
      >
        {label}
      </span>
      <button
        ref={thumbRef}
        type="button"
        disabled={disabled}
        aria-label={label}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerEnd}
        onPointerCancel={onPointerEnd}
        // detail === 0 means keyboard or assistive-tech activation, not a touch tap.
        onClick={(event) => {
          if (event.detail === 0) confirm()
        }}
        className={cn(
          'btn-gold absolute left-1 top-1 grid size-14 place-items-center rounded-full text-bg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light',
          dragging ? 'cursor-grabbing' : 'cursor-grab transition-transform duration-200',
        )}
        style={{
          transform: `translateX(${x}px)`,
          touchAction: 'none',
        }}
      >
        <ChevronsRight className="size-7" aria-hidden />
      </button>
    </div>
  )
}
