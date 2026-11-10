import type { ReactNode } from 'react'
import { Link } from 'react-router'
import { ArrowDownLeft, ArrowUpRight, RefreshCw } from 'lucide-react'
import { BannerCarousel } from '../components/home/BannerCarousel'
import { ConnectPrompt } from '../components/trade/ConnectPrompt'
import { Card } from '../components/ui/Card'
import { Disclosure } from '../components/ui/Disclosure'
import { Notice } from '../components/ui/Notice'
import { Skeleton } from '../components/ui/Skeleton'
import { TokenIcon } from '../components/ui/TokenIcon'
import { buttonStyles } from '../components/ui/Button'
import { MIN_POL_FOR_GAS } from '../config/trade'
import { useBalances } from '../hooks/useBalances'
import { useGoldQuote } from '../hooks/useGoldQuote'
import { useSettings } from '../settings/SettingsProvider'
import { formatGoldNumber, formatGold, formatUsd, pricePerUnit } from '../utils/format'
import { useWallet } from '../wallet/WalletProvider'

export function HomePage() {
  const { isConnected, address } = useWallet()
  const {
    data: balances,
    isLoading: balancesLoading,
    isFetching: balancesFetching,
    refetch: refetchBalances,
  } = useBalances(address)
  const { data: quote } = useGoldQuote()
  const { unit } = useSettings()

  if (!isConnected) {
    return (
      <ConnectPrompt
        symbol="PAXG"
        message="Connect your wallet in Nimiq Pay to see your gold and start saving."
      />
    )
  }

  const ready = Boolean(balances) && !balancesLoading
  const paxg = balances ? Number(balances.paxg.formatted) : 0
  const usdt = balances ? Number(balances.usdt.formatted) : 0
  const pol = balances ? Number(balances.pol.formatted) : 0
  const price = quote?.pricePerTroyOunce ?? null
  const goldValueUsd = ready && price ? paxg * price : null
  const polLow = ready && pol < MIN_POL_FOR_GAS

  return (
    <div className="fade-in flex flex-col gap-3">
      {/* Premium balance display — gold is an accent, not a flat card fill. */}
      <section aria-label="Your gold" className="gold-balance-card rounded-lg p-5">
        <div className="gold-balance-content">
          <div className="flex items-center gap-2">
            <span className="gold-balance-kicker-dot" aria-hidden />
            <p className="gold-balance-label">Your gold</p>
          </div>
          {ready ? (
            <>
              <p className="mt-1 flex items-baseline gap-2 tabular-nums">
                <span className="gold-balance-value">{formatGoldNumber(paxg, unit)}</span>
                <span className="gold-balance-unit">{unit === 'g' ? 'g' : 'oz'}</span>
              </p>
              <p className="gold-balance-fiat tabular-nums">
                {goldValueUsd !== null ? (
                  `≈ ${formatUsd(goldValueUsd)}`
                ) : (
                  <Skeleton className="mt-1 h-5 w-24" />
                )}
              </p>
            </>
          ) : (
            <div className="mt-2 space-y-2">
              <Skeleton className="h-12 w-40" />
              <Skeleton className="h-5 w-28" />
            </div>
          )}
        </div>
        {price ? (
          <span className="absolute right-4 top-3 inline-flex items-center rounded-full hairline-gold bg-gold/10 px-2 py-0.5 text-xs font-semibold tabular-nums text-gold-accent">
            {formatUsd(pricePerUnit(price, unit))} / {unit === 'g' ? 'g' : 'oz'}
          </span>
        ) : null}
        <div className="gold-balance-emblem" aria-hidden="true">
          <span className="gold-balance-emblem-ring" />
          <img src="/img/PAXG.png" alt="" />
        </div>
      </section>

      <div className="grid grid-cols-2 gap-3">
        <Link to="/buy" className={buttonStyles('gold', 'lg')}>
          <ArrowDownLeft className="size-5" aria-hidden />
          Buy gold
        </Link>
        <Link to="/sell" className={buttonStyles('outline', 'lg')}>
          <ArrowUpRight className="size-5" aria-hidden />
          Sell gold
        </Link>
      </div>

      <BannerCarousel />

      {/* Holdings (replaces the old Assets tab) */}
      <Card className="home-holdings-card p-0">
        <div className="flex items-center justify-between px-4 pt-1">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
            Holdings
          </h2>
          <button
            type="button"
            onClick={() => void refetchBalances()}
            disabled={balancesFetching}
            aria-label="Refresh balances"
            className="inline-flex size-8 items-center justify-center rounded-md text-text-muted transition-colors hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light disabled:opacity-50"
          >
            <RefreshCw className={`size-4 ${balancesFetching ? 'animate-spin' : ''}`} aria-hidden />
          </button>
        </div>
        <ul className="divide-y divide-white/10">
          <HoldingRow
            icon={<TokenIcon symbol="PAXG" size={36} />}
            name="Gold"
            sub="PAXG"
            primary={ready ? formatGold(paxg, unit) : null}
            secondary={goldValueUsd !== null ? formatUsd(goldValueUsd) : null}
          />
          <HoldingRow
            icon={<TokenIcon symbol="USDT" size={36} />}
            name="Dollars"
            sub="USDT"
            primary={ready ? formatUsd(usdt) : null}
            secondary={null}
          />
          <HoldingRow
            icon={<TokenIcon symbol="POL" size={36} />}
            name="Network fees"
            sub="POL"
            primary={ready ? `${pol.toFixed(3)} POL` : null}
            secondary={polLow ? 'Low' : null}
            warn={polLow}
          />
        </ul>
      </Card>

      {polLow ? (
        <Notice variant="warning" title="Low on POL">
          You need a little POL in your wallet to pay Polygon network fees before you can trade.
        </Notice>
      ) : null}

      <Disclosure title="What is PAXG?">
        <p>
          One PAXG token represents one fine troy ounce (31.1 g) of gold. The PAXG on Polygon is the
          Polygon PoS-bridged version of the Ethereum PAXG issued by Paxos — its value follows the
          gold market, so it can go up or down.
        </p>
        <p className="mt-2">
          Your gold stays in your own wallet. Gold Pocket never holds your funds or your keys.
        </p>
      </Disclosure>
    </div>
  )
}

function HoldingRow({
  icon,
  name,
  sub,
  primary,
  secondary,
  warn = false,
}: {
  icon: ReactNode
  name: string
  sub: string
  primary: string | null
  secondary: string | null
  warn?: boolean
}) {
  return (
    <li className="flex min-h-14 items-center gap-3 px-4 py-2">
      {icon}
      <div className="min-w-0 flex-1">
        <p className="font-semibold text-text">{name}</p>
        <p className="text-sm text-text-muted">{sub}</p>
      </div>
      <div className="text-right">
        {primary ? (
          <p className="font-semibold tabular-nums text-text">{primary}</p>
        ) : (
          <Skeleton className="ml-auto h-5 w-20" />
        )}
        {secondary ? (
          <p
            className={`text-sm tabular-nums ${warn ? 'font-medium text-warning' : 'text-text-muted'}`}
          >
            {secondary}
          </p>
        ) : null}
      </div>
    </li>
  )
}
