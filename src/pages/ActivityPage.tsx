import { useEffect, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router'
import { ArrowDownLeft, ArrowUpRight, History } from 'lucide-react'
import { useActivity, clearActivity, type ActivityRecord } from '../activity/store'
import { Button } from '../components/ui/Button'
import { EmptyState } from '../components/ui/EmptyState'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { Segmented } from '../components/ui/Segmented'
import { useSettings } from '../settings/SettingsProvider'
import { dayLabel, formatGold, formatTime } from '../utils/format'

type Filter = 'all' | 'buy' | 'sell'

export function ActivityPage() {
  const navigate = useNavigate()
  const [searchParams, setSearchParams] = useSearchParams()
  const records = useActivity()
  const { unit } = useSettings()
  const [filter, setFilter] = useState<Filter>('all')

  // Support ?reset=1 for quick demo cleanup (no console needed).
  useEffect(() => {
    if (searchParams.get('reset') === '1') {
      clearActivity()
      searchParams.delete('reset')
      setSearchParams(searchParams, { replace: true })
    }
  }, [searchParams, setSearchParams])

  const visible = records.filter((r) => filter === 'all' || r.side === filter)
  const groups = visible.reduce<{ label: string; items: ActivityRecord[] }[]>((acc, record) => {
    const label = dayLabel(record.createdAt)
    const last = acc[acc.length - 1]
    if (last && last.label === label) last.items.push(record)
    else acc.push({ label, items: [record] })
    return acc
  }, [])

  return (
    <div className="fade-in flex flex-col gap-4">
      <ScreenHeader title="Activity" />
      <Segmented
        label="Filter activity"
        value={filter}
        onChange={setFilter}
        options={[
          { value: 'all', label: 'All' },
          { value: 'buy', label: 'Buys' },
          { value: 'sell', label: 'Sells' },
        ]}
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={<History className="size-8" aria-hidden />}
          title={records.length === 0 ? 'No activity yet' : 'Nothing here'}
          description={
            records.length === 0
              ? 'Your gold purchases and sales will show up here.'
              : 'No transactions match this filter.'
          }
          action={
            records.length === 0 ? (
              <Button size="lg" onClick={() => navigate('/buy')}>
                Buy gold
              </Button>
            ) : undefined
          }
        />
      ) : (
        groups.map((group) => (
          <section key={group.label} aria-label={group.label}>
            <h2 className="mb-2 text-sm font-semibold uppercase tracking-wider text-text-muted">
              {group.label}
            </h2>
            <ul className="divide-y divide-white/10 overflow-hidden rounded-lg hairline bg-card">
              {group.items.map((record) => {
                const isBuy = record.side === 'buy'
                return (
                  <li key={record.id}>
                    <Link
                      to={`/receipt/${record.id}`}
                      className="flex min-h-16 items-center gap-3 px-4 py-3 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-gold-light"
                    >
                      <span className="grid size-10 shrink-0 place-items-center rounded-full bg-gold/15 text-gold">
                        {isBuy ? (
                          <ArrowDownLeft className="size-5" aria-hidden />
                        ) : (
                          <ArrowUpRight className="size-5" aria-hidden />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-text">
                          {isBuy ? 'Bought' : 'Sold'} {formatGold(record.paxg, unit)}
                        </p>
                        <p className="text-sm text-text-muted">
                          {formatTime(record.createdAt)}
                          {record.simulated ? ' · Demo' : ''}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold tabular-nums text-text">
                          {isBuy ? '−' : '+'}
                          {record.usdt.toFixed(2)}
                        </p>
                        <p className="text-sm text-text-muted">USDT</p>
                      </div>
                    </Link>
                  </li>
                )
              })}
            </ul>
          </section>
        ))
      )}
    </div>
  )
}
