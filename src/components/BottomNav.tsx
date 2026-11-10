import { Link, useLocation } from 'react-router'
import { ArrowLeftRight, History, Home, Settings } from 'lucide-react'
import { cn } from '../utils/cn'

const tabs = [
  { to: '/', label: 'Home', icon: Home, match: (p: string) => p === '/' },
  {
    to: '/buy',
    label: 'Trade',
    icon: ArrowLeftRight,
    match: (p: string) => p === '/buy' || p === '/sell',
  },
  {
    to: '/activity',
    label: 'Activity',
    icon: History,
    match: (p: string) => p.startsWith('/activity') || p.startsWith('/receipt'),
  },
  {
    to: '/settings',
    label: 'Settings',
    icon: Settings,
    match: (p: string) => p.startsWith('/settings'),
  },
] as const

export function BottomNav() {
  const { pathname } = useLocation()
  return (
    <nav
      aria-label="Primary"
      className="fixed inset-x-0 bottom-0 z-20 mx-auto max-w-[448px] border-t hairline bg-bg/95 backdrop-blur"
      style={{ height: 'var(--nav-h)', paddingBottom: 'var(--safe-b)' }}
    >
      <ul className="grid h-14 grid-cols-4">
        {tabs.map(({ to, label, icon: Icon, match }) => {
          const active = match(pathname)
          return (
            <li key={to}>
              <Link
                to={to}
                aria-current={active ? 'page' : undefined}
                className={cn(
                  'relative flex h-full flex-col items-center justify-center gap-1 text-xs font-semibold transition-colors duration-200 select-none cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-light',
                  active ? 'text-gold-light' : 'text-text-muted hover:text-text',
                )}
              >
                {active ? (
                  <span
                    className="absolute inset-x-6 top-0 h-0.5 rounded-full bg-gold"
                    aria-hidden
                  />
                ) : null}
                <Icon className="size-6" aria-hidden />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
