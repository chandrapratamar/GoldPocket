import { cn } from '../../utils/cn'

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span
      role="status"
      aria-label={label}
      className={cn(
        'inline-block size-6 animate-spin rounded-full border-2 border-text-dim border-t-gold',
        className,
      )}
    />
  )
}
