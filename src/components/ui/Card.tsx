import type { HTMLAttributes } from 'react'
import { cn } from '../../utils/cn'

export function Card({
  className,
  padding = 'md',
  ...props
}: HTMLAttributes<HTMLDivElement> & { padding?: 'md' | 'sm' }) {
  return (
    <div
      className={cn(
        'rounded-lg hairline bg-card shadow-premium',
        padding === 'sm' ? 'p-3' : 'p-4',
        className,
      )}
      {...props}
    />
  )
}
