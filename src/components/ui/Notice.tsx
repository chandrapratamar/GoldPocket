import { CircleAlert, Info, TriangleAlert } from 'lucide-react'
import type { ReactNode } from 'react'
import { cn } from '../../utils/cn'

type NoticeVariant = 'info' | 'warning' | 'danger'

const variantClasses: Record<NoticeVariant, string> = {
  info: 'hairline bg-card text-text-muted',
  warning: 'hairline-gold bg-gold/10 text-text-soft',
  danger: 'border border-danger/40 bg-danger/10 text-text-soft',
}

const iconClasses: Record<NoticeVariant, string> = {
  info: 'text-text-dim',
  warning: 'text-gold',
  danger: 'text-danger',
}

const icons = { info: Info, warning: CircleAlert, danger: TriangleAlert } as const

export function Notice({
  variant = 'info',
  title,
  children,
  className,
  compact = false,
}: {
  variant?: NoticeVariant
  title?: string
  children: ReactNode
  className?: string
  compact?: boolean
}) {
  const Icon = icons[variant]
  return (
    <div
      role={variant === 'info' ? undefined : 'alert'}
      className={cn(
        'flex rounded-md leading-relaxed',
        compact ? 'gap-2 p-2.5 text-xs' : 'gap-3 p-4 text-sm',
        variantClasses[variant],
        className,
      )}
    >
      <Icon
        className={cn('mt-0.5 shrink-0', compact ? 'size-4' : 'size-5', iconClasses[variant])}
        aria-hidden
      />
      <div className="min-w-0 flex-1">
        {title ? <p className="font-semibold text-text">{title}</p> : null}
        {children}
      </div>
    </div>
  )
}
