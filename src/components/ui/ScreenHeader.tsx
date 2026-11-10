import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { useNavigate } from 'react-router'

export function ScreenHeader({
  title,
  back,
  right,
}: {
  title: string
  back?: boolean
  right?: ReactNode
}) {
  const navigate = useNavigate()
  return (
    <div className="flex min-h-12 items-center gap-1 py-1">
      {back ? (
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="-ml-2 grid size-11 shrink-0 place-items-center rounded-md text-text-muted transition-colors hover:bg-card-elevated/60 hover:text-text cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light"
        >
          <ChevronLeft className="size-6" aria-hidden />
        </button>
      ) : null}
      <h1 className="flex-1 text-2xl font-bold tracking-tight text-text text-balance">{title}</h1>
      {right}
    </div>
  )
}
