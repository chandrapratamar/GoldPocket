import { cn } from '../../utils/cn'

export function Skeleton({ className }: { className?: string }) {
  return <span aria-hidden className={cn('skeleton block rounded-sm', className)} />
}
