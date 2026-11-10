import { Compass } from 'lucide-react'
import { Link } from 'react-router'
import { EmptyState } from '../components/ui/EmptyState'
import { buttonStyles } from '../components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="pt-20">
      <EmptyState
        icon={<Compass className="size-7" aria-hidden />}
        title="Page not found"
        description="The page you are looking for does not exist."
        action={
          <Link to="/" className={buttonStyles('outline')}>
            Back to Home
          </Link>
        }
      />
    </div>
  )
}
