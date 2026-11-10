import { Check, ChevronLeft, Copy, ExternalLink, SearchX } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router'
import { useActivityRecord } from '../activity/store'
import { Button, buttonStyles } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { EmptyState } from '../components/ui/EmptyState'
import { Notice } from '../components/ui/Notice'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { polygon } from '../config/chains'
import { useSettings } from '../settings/SettingsProvider'
import { useCopy } from '../utils/clipboard'
import { formatDateTime, formatGold, formatPaxg, formatUsd, truncateAddress } from '../utils/format'

export function ReceiptPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const record = useActivityRecord(id)
  const { unit } = useSettings()
  const [copied, copyHash] = useCopy(record?.txHash)

  if (!record) {
    return (
      <div className="flex flex-col gap-3">
        <ScreenHeader title="Receipt" back />
        <EmptyState
          icon={<SearchX className="size-8" aria-hidden />}
          title="Receipt not found"
          description="This transaction isn’t stored on this device."
          action={
            <Link to="/activity" className={buttonStyles('outline')}>
              Back to Activity
            </Link>
          }
        />
      </div>
    )
  }

  const isBuy = record.side === 'buy'

  return (
    <div className="fade-in flex flex-col gap-2">
      <div className="flex min-h-9 items-center gap-1 py-0.5">
        <button
          type="button"
          onClick={() => navigate(-1)}
          aria-label="Go back"
          className="-ml-2 grid size-9 shrink-0 place-items-center rounded-md text-text-muted transition-colors hover:bg-card-elevated/60 hover:text-text cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light"
        >
          <ChevronLeft className="size-5" aria-hidden />
        </button>
        <h1 className="flex-1 text-lg font-bold tracking-tight text-text">Receipt</h1>
      </div>

      <div className="flex flex-col items-center py-1 text-center">
        <span className="check-pop mb-2 grid size-14 place-items-center rounded-full border border-gold/40 bg-gold/15 text-gold">
          <Check className="size-7" strokeWidth={3} aria-hidden />
        </span>
        <h2 className="text-xl font-bold tracking-tight text-text">
          {isBuy ? 'You bought' : 'You sold'}
        </h2>
        <p className="mt-0.5 text-3xl font-bold tabular-nums text-gold-light">
          {formatGold(record.paxg, unit)}
        </p>
        <p className="mt-0.5 text-xs tabular-nums text-text-muted">{formatPaxg(record.paxg)}</p>
      </div>

      {record.simulated ? (
        <Notice variant="warning" title="Demo transaction">
          This was a preview. No funds moved and nothing was recorded on the blockchain.
        </Notice>
      ) : null}

      <Card className="py-1">
        <dl className="divide-y divide-white/10 text-sm">
          <Line label={isBuy ? 'Paid' : 'Received'} value={`${record.usdt.toFixed(2)} USDT`} />
          <Line label={isBuy ? 'Received' : 'Sold'} value={formatGold(record.paxg, unit)} />
          <Line label="Gold price" value={`${formatUsd(record.priceUsd)} / oz`} />
          <Line label="Fees (estimated)" value={`~${formatUsd(record.feesUsd)}`} />
          <Line label="Date" value={formatDateTime(record.createdAt)} />
          <Line label="Network" value="Polygon" />
          {record.provider ? (
            <Line label="Route" value={record.provider === 'lifi' ? 'Li.Fi' : '1inch'} />
          ) : null}
          <div className="flex min-h-10 items-center justify-between gap-3 py-1">
            <dt className="text-text-muted">Transaction</dt>
            <dd className="flex items-center gap-1 font-medium text-text">
              {record.txHash ? (
                <>
                  <span className="font-mono tabular-nums">{truncateAddress(record.txHash)}</span>
                  <button
                    type="button"
                    onClick={copyHash}
                    aria-label="Copy transaction hash"
                    className="grid size-8 place-items-center rounded-md text-text-muted hover:text-text cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light"
                  >
                    {copied ? (
                      <Check className="size-4 text-success" aria-hidden />
                    ) : (
                      <Copy className="size-4" aria-hidden />
                    )}
                  </button>
                </>
              ) : (
                <span className="text-text-dim">Not available in demo</span>
              )}
            </dd>
          </div>
        </dl>
      </Card>

      <div className="grid gap-1.5">
        <Button size="md" onClick={() => navigate('/')}>
          Done
        </Button>
        {record.txHash ? (
          <a
            href={`${polygon.explorerUrl}/tx/${record.txHash}`}
            target="_blank"
            rel="noreferrer"
            className={buttonStyles('outline', 'md')}
          >
            View on PolygonScan
            <ExternalLink className="size-4" aria-hidden />
          </a>
        ) : null}
      </div>
    </div>
  )
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex min-h-10 items-center justify-between gap-3 py-1">
      <dt className="text-text-muted">{label}</dt>
      <dd className="text-right font-medium tabular-nums text-text">{value}</dd>
    </div>
  )
}
