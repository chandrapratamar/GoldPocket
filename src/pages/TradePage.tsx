import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router'
import { ArrowLeftRight } from 'lucide-react'
import { AmountDisplay, type AmountPill } from '../components/trade/AmountDisplay'
import { ConnectPrompt } from '../components/trade/ConnectPrompt'
import { FeeSummary } from '../components/trade/FeeSummary'
import { Keypad } from '../components/trade/Keypad'
import { useQuoteFreshness } from '../components/trade/useQuoteFreshness'
import { ReviewSheet } from '../components/trade/ReviewSheet'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Notice } from '../components/ui/Notice'
import { Segmented } from '../components/ui/Segmented'
import { Skeleton } from '../components/ui/Skeleton'
import { TokenIcon } from '../components/ui/TokenIcon'
import { polygon } from '../config/chains'
import {
  BUY_PILL_AMOUNTS,
  ESTIMATED_NETWORK_FEE_USD,
  ESTIMATED_SWAP_FEE_RATE,
  LARGE_TRADE_USD,
  MIN_POL_FOR_GAS,
  SELL_PILL_FRACTIONS,
} from '../config/trade'
import { useBalances } from '../hooks/useBalances'
import { useGoldQuote } from '../hooks/useGoldQuote'
import { useSwapQuote } from '../hooks/useSwapQuote'
import { useSettings } from '../settings/SettingsProvider'
import { PROVIDER_LABELS } from '../trade/swapClient'
import type { TradeSide } from '../types'
import {
  formatGold,
  formatPaxg,
  formatUsd,
  paxgToUnit,
  toInputString,
  unitToPaxg,
} from '../utils/format'
import { useWallet } from '../wallet/WalletProvider'

export function TradePage({ side }: { side: TradeSide }) {
  const isBuy = side === 'buy'
  const navigate = useNavigate()
  const { search } = useLocation()
  const { isConnected, address, chainId, switchChain } = useWallet()
  const { data: balances, isLoading: balancesLoading } = useBalances(address)
  const { data: quote, isFetching, refetch, dataUpdatedAt } = useGoldQuote()
  const { unit, setUnit, slippage } = useSettings()
  const [amount, setAmount] = useState('')
  const [reviewOpen, setReviewOpen] = useState(false)
  const { remaining, expired } = useQuoteFreshness(dataUpdatedAt)

  // Ask for a fresh rate once when the current one expires; the Refresh button handles retries.
  const refreshedFor = useRef(0)
  useEffect(() => {
    if (expired && !isFetching && dataUpdatedAt && refreshedFor.current !== dataUpdatedAt) {
      refreshedFor.current = dataUpdatedAt
      void refetch()
    }
  }, [expired, isFetching, dataUpdatedAt, refetch])

  const price = quote?.pricePerTroyOunce ?? null
  const usdtBal = balances ? Number(balances.usdt.formatted) : 0
  const paxgBal = balances ? Number(balances.paxg.formatted) : 0
  const polBal = balances ? Number(balances.pol.formatted) : 0
  const balancesReady = Boolean(balances) && !balancesLoading

  const amountNum = Number.parseFloat(amount) || 0
  const maxDecimals = isBuy ? 2 : unit === 'g' ? 4 : 6
  const swapFeeRate = ESTIMATED_SWAP_FEE_RATE
  const paxg = isBuy
    ? price
      ? (amountNum * (1 - swapFeeRate)) / price
      : 0
    : unitToPaxg(amountNum, unit)
  const grossUsdt = price ? paxg * price : 0
  const usdt = isBuy ? amountNum : grossUsdt * (1 - swapFeeRate)
  const spend = isBuy ? usdt : paxg
  const balance = isBuy ? usdtBal : paxgBal
  const insufficient = amountNum > 0 && spend > balance + 1e-9

  const networkFee = amountNum > 0 ? ESTIMATED_NETWORK_FEE_USD : 0
  const swapFee = (isBuy ? amountNum : grossUsdt) * swapFeeRate
  const totalFees = networkFee + swapFee
  const minReceivedLabel = isBuy
    ? formatGold(paxg * (1 - slippage / 100), unit)
    : formatUsd(usdt * (1 - slippage / 100))

  const polLow = balancesReady && polBal < MIN_POL_FOR_GAS
  const noGold = balancesReady && !isBuy && paxgBal === 0
  const wrongNetwork = chainId !== null && chainId !== polygon.id

  // Preview the exact route the trade will use: the server compares every
  // aggregator and returns only the winner.
  const quoteAmount = isBuy ? Number(usdt.toFixed(2)) : Number(paxg.toFixed(8))
  const { data: swapQuote } = useSwapQuote({
    side,
    amount: quoteAmount,
    fromAddress: address,
    slippagePct: slippage,
    enabled: amountNum > 0,
  })
  // Ignore a quote that belongs to a previous amount while the new one loads.
  const quotedAmount = swapQuote
    ? Number(swapQuote.fromAmount) / 10 ** swapQuote.fromDecimals
    : null
  const routeQuote =
    quotedAmount !== null && Math.abs(quotedAmount - quoteAmount) < 1e-6 ? swapQuote : null
  const routeLabel = routeQuote ? PROVIDER_LABELS[routeQuote.provider] : null

  if (!isConnected) {
    return (
      <ConnectPrompt
        symbol={isBuy ? 'USDT' : 'PAXG'}
        message={`Connect your wallet in Nimiq Pay to ${isBuy ? 'buy gold with USDT' : 'sell gold for USDT'}.`}
      />
    )
  }

  const pillSpecs: { label: string; value: string }[] = isBuy
    ? [
        ...BUY_PILL_AMOUNTS.map((n) => ({ label: `$${n}`, value: String(n) })),
        { label: 'Max', value: toInputString(usdtBal, 2) },
      ]
    : [...SELL_PILL_FRACTIONS, 1].map((f) => ({
        label: f === 1 ? 'Max' : `${f * 100}%`,
        value: toInputString(paxgToUnit(paxgBal * f, unit), f === 1 ? 6 : maxDecimals),
      }))
  const pills: AmountPill[] = pillSpecs.map((p) => ({
    ...p,
    active: p.value !== '' && amount !== '' && Number.parseFloat(p.value) === amountNum,
  }))

  const toggleUnit = () => {
    const next = unit === 'g' ? 'oz' : 'g'
    if (amountNum > 0) setAmount(toInputString(paxgToUnit(paxg, next), next === 'g' ? 4 : 6))
    setUnit(next)
  }

  const goTo = (next: TradeSide) => navigate({ pathname: `/${next}`, search }, { replace: true })

  // Nothing to sell yet: a keypad would be a dead end, so show a single clear next step.
  if (noGold) {
    return (
      <div className="fade-in flex h-full flex-col">
        <Segmented
          label="Trade direction"
          value={side}
          onChange={goTo}
          options={[
            { value: 'buy', label: 'Buy' },
            { value: 'sell', label: 'Sell' },
          ]}
        />
        <div className="flex flex-1 flex-col items-center justify-center pb-6 text-center">
          <div className="mb-4 grid size-16 place-items-center rounded-full hairline-gold bg-gold/10">
            <TokenIcon symbol="PAXG" size={32} />
          </div>
          <h2 className="text-xl font-bold tracking-tight text-text">You don’t own any gold yet</h2>
          <p className="mt-2 max-w-xs text-sm leading-relaxed text-text-muted">
            Buy gold with USDT first — then you can sell it here.
          </p>
          <Button size="lg" className="mt-5 w-full max-w-sm" onClick={() => goTo('buy')}>
            Buy gold
          </Button>
        </div>
      </div>
    )
  }

  let cta: { label: string; disabled: boolean; onClick?: () => void }
  if (wrongNetwork) {
    cta = { label: 'Switch to Polygon', disabled: false, onClick: () => void switchChain() }
  } else if (!balancesReady) {
    cta = { label: 'Loading balance…', disabled: true }
  } else if (!price) {
    cta = { label: isFetching ? 'Loading rate…' : 'Rate unavailable', disabled: true }
  } else if (polLow) {
    cta = { label: 'Add POL for network fees', disabled: true }
  } else if (amountNum <= 0) {
    cta = { label: 'Enter an amount', disabled: true }
  } else if (insufficient) {
    cta = { label: isBuy ? 'Insufficient USDT' : 'Insufficient gold', disabled: true }
  } else if (amountNum > 0 && !swapQuote) {
    cta = { label: 'Loading rate…', disabled: true }
  } else if (expired) {
    cta = {
      label: isFetching ? 'Updating rate…' : 'Rate expired · Refresh',
      disabled: isFetching,
      onClick: isFetching ? undefined : () => void refetch(),
    }
  } else {
    cta = {
      label: isBuy ? 'Review purchase' : 'Review sale',
      disabled: false,
      onClick: () => setReviewOpen(true),
    }
  }

  const amountError = insufficient
    ? isBuy
      ? `Not enough USDT. You have ${formatUsd(usdtBal)}.`
      : `You only have ${formatGold(paxgBal, unit)}.`
    : null

  const availableLabel = balancesReady
    ? isBuy
      ? formatUsd(usdtBal)
      : formatGold(paxgBal, unit)
    : null
  const leftLabel = isBuy
    ? formatUsd(Math.max(0, usdtBal - usdt))
    : formatGold(Math.max(0, paxgBal - paxg), unit)

  return (
    <div className="fade-in flex h-full flex-col">
      <div className="scrollbar-hide flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto pb-4">
        <Segmented
          label="Trade direction"
          value={side}
          onChange={goTo}
          options={[
            { value: 'buy', label: 'Buy' },
            { value: 'sell', label: 'Sell' },
          ]}
        />

        <Card padding="sm">
          <AmountDisplay
            value={amount}
            prefix={isBuy ? '$' : undefined}
            suffix={isBuy ? undefined : unit}
            symbol={isBuy ? 'USDT' : 'PAXG'}
            pills={pills}
            onPill={setAmount}
            error={amountError}
            extra={
              isBuy ? undefined : (
                <button
                  type="button"
                  onClick={toggleUnit}
                  aria-label={`Switch to ${unit === 'g' ? 'troy ounces' : 'grams'}`}
                  className="inline-flex min-h-11 items-center gap-1.5 rounded-full hairline px-3 text-sm font-semibold text-gold-accent cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light"
                >
                  <ArrowLeftRight className="size-4" aria-hidden />
                  {unit === 'g' ? 'oz' : 'g'}
                </button>
              )
            }
          />

          <div className="mt-1.5 flex items-end justify-between gap-3 border-t border-white/10 pt-1.5">
            <div className="min-w-0">
              <p className="text-xs text-text-muted">You receive (estimated)</p>
              <p className="truncate text-base font-bold tabular-nums text-text">
                {amountNum > 0 && price
                  ? `≈ ${isBuy ? formatGold(paxg, unit) : formatUsd(usdt)}`
                  : '—'}
              </p>
            </div>
            <div className="shrink-0 text-right">
              <p className="text-xs tabular-nums text-text-muted">
                {amountNum > 0 && price
                  ? isBuy
                    ? formatPaxg(paxg)
                    : `${usdt.toFixed(2)} USDT`
                  : isBuy
                    ? 'PAXG'
                    : 'USDT'}
              </p>
              <p className="text-xs tabular-nums text-text-dim">
                {amountNum > 0 && !insufficient
                  ? `Left ${leftLabel}`
                  : availableLabel
                    ? `Avail ${availableLabel}`
                    : '—'}
              </p>
            </div>
          </div>
        </Card>

        <Card padding="sm" className="grid grid-cols-[1fr_auto] items-center gap-x-2 py-1">
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tabular-nums text-text">
              {price ? `1 PAXG = ${formatUsd(price)}` : <Skeleton className="h-4 w-32" />}
            </p>
            <div className="mt-0.5 flex flex-wrap items-center gap-1.5">
              <p className="text-xs text-text-dim">
                Rate
                {quote ? (
                  <>
                    {' · '}
                    <span className={expired ? 'text-warning' : undefined}>
                      {expired ? 'expired' : `${remaining}s`}
                    </span>
                  </>
                ) : null}
              </p>
              {routeLabel ? (
                <span className="inline-flex items-center gap-1 rounded-full hairline-gold bg-gold/10 px-1.5 py-px text-[10px] font-semibold leading-4 text-gold-accent">
                  Best rate · {routeLabel}
                </span>
              ) : null}
            </div>
          </div>
          <FeeSummary
            compact
            totalFeesUsd={totalFees}
            rows={[
              { label: 'Network fee', value: `~${formatUsd(networkFee)}` },
              { label: 'Swap fee', value: `~${formatUsd(swapFee)}` },
              { label: 'Minimum received', value: amountNum > 0 && price ? minReceivedLabel : '—' },
              { label: 'Slippage limit', value: `${slippage}%` },
            ]}
          />
        </Card>

        {usdt >= LARGE_TRADE_USD ? (
          <Notice compact variant="warning" title="Large trade">
            Bigger trades can move the price against you. Check the minimum received before
            confirming.
          </Notice>
        ) : null}
      </div>

      <div className="shrink-0 pt-2">
        <Keypad
          value={amount}
          onChange={setAmount}
          maxDecimals={maxDecimals}
          enabled={!reviewOpen}
        />
        <Button size="lg" className="mt-2 w-full" disabled={cta.disabled} onClick={cta.onClick}>
          {cta.label}
        </Button>
      </div>

      <ReviewSheet
        open={reviewOpen}
        onClose={() => setReviewOpen(false)}
        side={side}
        usdt={usdt}
        paxg={paxg}
        priceUsd={price ?? 0}
        feesUsd={totalFees}
        slippagePct={slippage}
        payLabel={isBuy ? `${usdt.toFixed(2)} USDT` : formatGold(paxg, unit)}
        receiveLabel={`≈ ${isBuy ? formatGold(paxg, unit) : `${usdt.toFixed(2)} USDT`}`}
        minReceivedLabel={minReceivedLabel}
        amount={isBuy ? usdt : paxg}
        fromAddress={address}
        routeLabel={routeLabel}
        blockedReason={expired ? 'Rate expired — refreshing…' : null}
      />
    </div>
  )
}
