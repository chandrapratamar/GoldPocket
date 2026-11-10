import { Link, Outlet } from 'react-router'
import { BottomNav } from '../components/BottomNav'
import { ConnectButton } from '../components/wallet/ConnectButton'
import { NetworkBanner } from '../components/wallet/NetworkBanner'
import { app } from '../config/app'
import { polygon } from '../config/chains'
import { useWallet } from '../wallet/WalletProvider'
import { truncateAddress } from '../utils/format'
import { cn } from '../utils/cn'

export function AppLayout() {
  const { isConnected, address, chainId } = useWallet()
  const onPolygon = chainId === polygon.id

  return (
    <div className="mx-auto flex h-dvh w-full max-w-[448px] flex-col overflow-hidden">
      <header className="z-20 shrink-0 border-b hairline bg-bg/90 backdrop-blur">
        <div className="flex h-14 items-center justify-between px-4">
          <img
            src="/img/GoldPocket-Logo.webp"
            alt={app.name}
            width={2172}
            height={724}
            draggable={false}
            className="h-full w-auto"
          />
          {isConnected && address ? (
            <Link
              to="/settings"
              aria-label="Wallet and settings"
              className="inline-flex min-h-10 items-center gap-2 rounded-full hairline bg-card px-3 text-sm font-medium text-text-soft focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light"
            >
              <span
                className={cn('size-2 rounded-full', onPolygon ? 'bg-success' : 'bg-warning')}
                aria-hidden
              />
              {truncateAddress(address)}
            </Link>
          ) : (
            <ConnectButton className="w-auto" />
          )}
        </div>
      </header>
      <main
        className="min-h-0 flex-1 overflow-y-auto px-4 pt-3"
        style={{ paddingBottom: 'calc(var(--nav-h) + 0.5rem)' }}
      >
        <NetworkBanner />
        <Outlet />
      </main>
      <BottomNav />
    </div>
  )
}
