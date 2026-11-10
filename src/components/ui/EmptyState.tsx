import type { ReactNode } from 'react'

export function EmptyState({
  icon,
  title,
  description,
  action,
}: {
  icon: ReactNode
  title: string
  description: string
  action?: ReactNode
}) {
  return (
    <div className="flex flex-col items-center px-6 py-14 text-center">
      <span className="grid size-16 place-items-center rounded-full hairline-gold bg-gold/10 text-gold">
        {icon}
      </span>
      <h2 className="mt-5 text-xl font-semibold tracking-tight text-text">{title}</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-text-muted">{description}</p>
      {action ? <div className="mt-6">{action}</div> : null}
    </div>
  )
}
