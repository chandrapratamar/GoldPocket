import { Check, Copy } from 'lucide-react'
import { Button } from '../components/ui/Button'
import { Card } from '../components/ui/Card'
import { Disclosure } from '../components/ui/Disclosure'
import { Notice } from '../components/ui/Notice'
import { ScreenHeader } from '../components/ui/ScreenHeader'
import { Segmented } from '../components/ui/Segmented'
import { app } from '../config/app'
import { polygon } from '../config/chains'
import { SLIPPAGE_OPTIONS } from '../config/trade'
import { useSettings } from '../settings/SettingsProvider'
import { useCopy } from '../utils/clipboard'
import { truncateAddress } from '../utils/format'
import { useWallet } from '../wallet/WalletProvider'

export function SettingsPage() {
  const { isConnected, address, chainId, disconnect, switchChain } = useWallet()
  const { unit, setUnit, slippage, setSlippage } = useSettings()
  const [copied, copy] = useCopy(address)
  const onPolygon = chainId === polygon.id

  return (
    <div className="fade-in flex flex-col gap-4">
      <ScreenHeader title="Settings" />

      <Card>
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Wallet</h2>
        {isConnected && address ? (
          <>
            <div className="mt-3 flex items-center gap-2">
              <p className="flex-1 truncate font-mono text-base text-text" title={address}>
                {truncateAddress(address)}
              </p>
              <button
                type="button"
                onClick={copy}
                aria-label={copied ? 'Address copied' : 'Copy wallet address'}
                className="inline-flex min-h-11 items-center gap-1.5 rounded-md hairline px-3 text-sm font-semibold text-text-soft cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-light"
              >
                {copied ? (
                  <Check className="size-4 text-success" aria-hidden />
                ) : (
                  <Copy className="size-4" aria-hidden />
                )}
                {copied ? 'Copied' : 'Copy'}
              </button>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <span
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-sm font-medium ${
                  onPolygon ? 'bg-success/10 text-success' : 'bg-warning/10 text-warning'
                }`}
              >
                <span
                  className={`size-2 rounded-full ${onPolygon ? 'bg-success' : 'bg-warning'}`}
                  aria-hidden
                />
                {onPolygon ? 'Polygon' : 'Wrong network'}
              </span>
              {!onPolygon ? (
                <Button variant="outline" onClick={() => void switchChain()}>
                  Switch to Polygon
                </Button>
              ) : null}
            </div>
          </>
        ) : (
          <p className="mt-2 text-sm text-text-muted">No wallet connected.</p>
        )}
      </Card>

      <Card className="space-y-5">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">
          Preferences
        </h2>
        <div>
          <p className="mb-2 font-semibold text-text">Gold unit</p>
          <Segmented
            label="Gold unit"
            value={unit}
            onChange={setUnit}
            options={[
              { value: 'g', label: 'Grams' },
              { value: 'oz', label: 'Troy ounces' },
            ]}
          />
        </div>
        <div>
          <p className="font-semibold text-text">Slippage limit</p>
          <p className="mb-2 mt-0.5 text-sm text-text-muted">
            The most the price may move against you before a trade is stopped.
          </p>
          <Segmented
            label="Slippage limit"
            value={slippage}
            onChange={setSlippage}
            options={SLIPPAGE_OPTIONS.map((s) => ({ value: s, label: `${s}%` }))}
          />
        </div>
      </Card>

      <section aria-label="Help" className="space-y-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-text-muted">Help</h2>
        <Disclosure title="What is PAXG?">
          One PAXG token represents one fine troy ounce (31.1 g) of gold. The PAXG held on Polygon
          is the Polygon PoS-bridged version of the Ethereum PAXG issued by Paxos — its value
          follows the gold market and can go up or down.
        </Disclosure>
        <Disclosure title="How do I redeem for physical gold?">
          Redemption for physical gold is handled by Paxos on Ethereum. Polygon holdings must be
          bridged back to Ethereum first, and bridging carries its own risk.
        </Disclosure>
        <Disclosure title="How do fees work?">
          Each trade has a small network fee, paid in POL, and a swap fee taken from the exchange.
          You see the total before you confirm. Amounts shown with “~” are estimates.
        </Disclosure>
        <Disclosure title="Is my gold safe?">
          Gold Pocket is self-custodial: your tokens stay in your wallet, and every transaction
          needs your approval. We never hold your funds or your keys.
        </Disclosure>
      </section>

      <Notice variant="warning" title="Good to know">
        PAXG on Polygon is bridged via the Polygon PoS bridge, not issued natively by Paxos.
        Bridging back to Ethereum (required to redeem for physical gold) carries its own risk.
        Prices fluctuate and this is not investment advice.
      </Notice>

      {isConnected ? (
        <Button variant="ghost" onClick={disconnect} className="self-center">
          Disconnect wallet
        </Button>
      ) : null}

      <p className="pb-2 text-center text-sm text-text-dim">
        {app.name} v{app.version}
      </p>
    </div>
  )
}
