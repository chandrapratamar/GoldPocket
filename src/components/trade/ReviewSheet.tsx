import { useEffect, useRef, useState } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { useNavigate } from 'react-router'
import { ArrowDown, Check, CircleAlert } from 'lucide-react'
import type { Address } from 'viem'
import { addActivity } from '../../activity/store'
import { SIMULATED_TRADES } from '../../config/trade'
import { runTrade } from '../../trade/execute'
import { runSimulatedTrade } from '../../trade/simulate'
import { TradeError, type TradeErrorCode, type TradeStep } from '../../trade/types'
import type { TradeSide } from '../../types'
import { cn } from '../../utils/cn'
import { haptic } from '../../utils/haptics'
import { formatUsd } from '../../utils/format'
import { BottomSheet } from '../ui/BottomSheet'
import { Button } from '../ui/Button'
import { Notice } from '../ui/Notice'
import { Spinner } from '../ui/Spinner'
import { TokenIcon } from '../ui/TokenIcon'
import { SwipeToConfirm } from '../ui/SwipeToConfirm'

type Phase = 'review' | 'running' | 'error'

interface ReviewSheetProps {
  open: boolean
  onClose: () => void
  side: TradeSide
  usdt: number
  paxg: number
  priceUsd: number
  feesUsd: number
  slippagePct: number
  payLabel: string
  receiveLabel: string
  minReceivedLabel: string
  /** Amount of the token being spent, in whole units: USDT for a buy, PAXG for a sell. */
  amount: number
  fromAddress: Address | null
  /** Winning aggregator for the live quote, e.g. "LI.FI" or "1inch". */
  routeLabel?: string | null
  /** When set, confirmation is blocked and this explains why (e.g. the rate expired). */
  blockedReason?: string | null
}

const errorCopy: Record<TradeErrorCode, { title: string; hint: string }> = {
  rejected: {
    title: 'Cancelled in your wallet',
    hint: 'Nothing was spent. You can try again whenever you are ready.',
  },
  slippage: {
    title: 'Price moved too much',
    hint: 'The market changed beyond your slippage limit, so the trade was stopped. Nothing was spent. Try again at the new rate.',
  },
  unavailable: {
    title: 'No route available',
    hint: 'The swap service could not quote this amount right now. Nothing was spent — try a different amount or retry shortly.',
  },
  failed: {
    title: 'Something went wrong',
    hint: 'The transaction could not be completed. Check Activity before retrying in case it went through.',
  },
}

export function ReviewSheet({
  open,
  onClose,
  side,
  usdt,
  paxg,
  priceUsd,
  feesUsd,
  slippagePct,
  payLabel,
  receiveLabel,
  minReceivedLabel,
  amount,
  fromAddress,
  routeLabel,
  blockedReason,
}: ReviewSheetProps) {
  const navigate = useNavigate()
  const queryClient = useQueryClient()
  const [phase, setPhase] = useState<Phase>('review')
  const [step, setStep] = useState<TradeStep>('quote')
  const [errorCode, setErrorCode] = useState<TradeErrorCode>('failed')
  const [errorMessage, setErrorMessage] = useState<string>('')
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  // Always start from the review state when the sheet is reopened.
  useEffect(() => {
    if (open) {
      setPhase('review')
      setErrorMessage('')
    }
  }, [open])

  const isBuy = side === 'buy'

  const start = async () => {
    if (blockedReason || !fromAddress) return
    setPhase('running')
    setStep('quote')
    try {
      const request = { side, amount, fromAddress, slippagePct }
      const outcome = SIMULATED_TRADES
        ? await runSimulatedTrade(request, (next) => mounted.current && setStep(next))
        : await runTrade(request, (next) => mounted.current && setStep(next))
      const record = addActivity({
        side,
        usdt: isBuy ? usdt : (outcome.receivedAmount ?? usdt),
        paxg: isBuy ? (outcome.receivedAmount ?? paxg) : paxg,
        priceUsd,
        feesUsd,
        slippagePct,
        simulated: SIMULATED_TRADES,
        txHash: outcome.txHash,
        provider: outcome.provider,
      })
      // Refresh balances immediately so Home/Trade reflect the new holdings.
      void queryClient.invalidateQueries({ queryKey: ['balances'] })
      haptic([20, 60, 20])
      if (mounted.current) navigate(`/receipt/${record.id}`, { replace: true })
    } catch (error) {
      if (!mounted.current) return
      setErrorCode(error instanceof TradeError ? error.code : 'failed')
      setErrorMessage(error instanceof Error ? error.message : 'Unknown error')
      setPhase('error')
    }
  }

  const steps: { id: TradeStep; title: string; detail: string }[] = [
    {
      id: 'quote',
      title: 'Finding the best rate',
      detail: 'Comparing live swap quotes for your amount.',
    },
    {
      id: 'approve',
      title: isBuy ? 'Allow USDT' : 'Allow PAXG',
      detail:
        'Your wallet will ask you to approve the swap. This only lets Gold Pocket use this amount.',
    },
    {
      id: 'swap',
      title: 'Swap',
      detail: isBuy ? 'Exchanging USDT for gold.' : 'Exchanging gold for USDT.',
    },
  ]

  return (
    <BottomSheet
      open={open}
      onClose={onClose}
      title={
        phase === 'review'
          ? isBuy
            ? 'Review purchase'
            : 'Review sale'
          : isBuy
            ? 'Buying gold'
            : 'Selling gold'
      }
      dismissible={phase !== 'running'}
    >
      {phase === 'review' ? (
        <div className="flex flex-col gap-4">
          <div className="rounded-lg bg-card p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">You pay</p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums text-text">{payLabel}</p>
              </div>
              <TokenIcon symbol={isBuy ? 'USDT' : 'PAXG'} size={32} />
            </div>
            <div className="my-3 flex items-center gap-3 text-text-dim" aria-hidden>
              <span className="h-px flex-1 bg-white/10" />
              <ArrowDown className="size-5" />
              <span className="h-px flex-1 bg-white/10" />
            </div>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-text-muted">You receive (estimated)</p>
                <p className="mt-0.5 text-2xl font-bold tabular-nums text-gold-light">
                  {receiveLabel}
                </p>
                {routeLabel ? (
                  <span className="mt-2 inline-flex items-center rounded-full hairline-gold bg-gold/10 px-2 py-0.5 text-xs font-semibold text-gold-accent">
                    Best rate
                  </span>
                ) : null}
              </div>
              <TokenIcon symbol={isBuy ? 'PAXG' : 'USDT'} size={32} />
            </div>
          </div>

          <dl className="space-y-3 text-sm">
            <Row label="Estimated rate" value={`1 PAXG = ${formatUsd(priceUsd)}`} />
            {routeLabel ? <Row label="Route" value={routeLabel} /> : null}
            <Row label="Total fees" value={`~${formatUsd(feesUsd)}`} />
            <Row label="Minimum received" value={minReceivedLabel} />
            <Row label="Slippage limit" value={`${slippagePct}%`} />
            <Row label="Network" value="Polygon" />
          </dl>

          {!SIMULATED_TRADES ? (
            <p className="text-xs leading-relaxed text-text-dim">
              Final amounts are set by the live swap quote when you confirm.
            </p>
          ) : null}

          {SIMULATED_TRADES ? (
            <Notice variant="warning" title="Demo mode">
              This is a preview. No transaction is sent and no funds move.
            </Notice>
          ) : null}
          {blockedReason ? (
            <p className="text-center text-sm font-medium text-warning">{blockedReason}</p>
          ) : null}

          <SwipeToConfirm
            label={isBuy ? 'Swipe to buy gold' : 'Swipe to sell gold'}
            onConfirm={() => void start()}
            disabled={Boolean(blockedReason) || !fromAddress}
          />
        </div>
      ) : null}

      {phase === 'running' ? (
        <div className="flex flex-col gap-4" aria-live="polite">
          <ol className="space-y-4">
            {steps.map((s, index) => {
              const status =
                s.id === step
                  ? 'active'
                  : steps.findIndex((x) => x.id === step) > index
                    ? 'done'
                    : 'pending'
              return (
                <li key={s.id} className="flex gap-3">
                  <span
                    className={cn(
                      'mt-0.5 grid size-8 shrink-0 place-items-center rounded-full text-sm font-bold',
                      status === 'done' && 'bg-gold text-bg',
                      status === 'active' && 'hairline-gold text-gold',
                      status === 'pending' && 'bg-card text-text-dim',
                    )}
                  >
                    {status === 'done' ? (
                      <Check className="size-5" aria-hidden />
                    ) : status === 'active' ? (
                      <Spinner className="size-5" label={`${s.title} in progress`} />
                    ) : (
                      index + 1
                    )}
                  </span>
                  <div>
                    <p
                      className={cn(
                        'font-semibold',
                        status === 'pending' ? 'text-text-dim' : 'text-text',
                      )}
                    >
                      {s.title}
                    </p>
                    {status === 'active' ? (
                      <p className="mt-0.5 text-sm text-text-muted">{s.detail}</p>
                    ) : null}
                  </div>
                </li>
              )
            })}
          </ol>
          <p className="text-center text-sm text-text-muted">
            Keep this screen open until it finishes.
          </p>
        </div>
      ) : null}

      {phase === 'error' ? (
        <div className="flex flex-col items-center gap-3 pt-2 text-center" role="alert">
          <span className="grid size-16 place-items-center rounded-full border border-danger/40 bg-danger/10 text-danger">
            <CircleAlert className="size-8" aria-hidden />
          </span>
          <h3 className="text-xl font-bold text-text">{errorCopy[errorCode].title}</h3>
          <p className="max-w-xs text-sm leading-relaxed text-text-muted">
            {errorCopy[errorCode].hint}
          </p>
          {errorMessage ? (
            <p className="max-w-xs text-xs leading-relaxed text-text-dim break-all">
              {errorMessage}
            </p>
          ) : null}
          <div className="mt-2 grid w-full gap-2">
            <Button size="lg" onClick={() => setPhase('review')}>
              Try again
            </Button>
            <Button variant="ghost" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      ) : null}
    </BottomSheet>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between gap-4">
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-right font-medium tabular-nums text-text">{value}</dd>
    </div>
  )
}
