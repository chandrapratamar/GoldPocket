import { TokenIcon } from '../ui/TokenIcon'
import { ConnectButton } from '../wallet/ConnectButton'

export function ConnectPrompt({ symbol, message }: { symbol: string; message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-14 text-center">
      <div className="mb-4 grid size-16 place-items-center rounded-full hairline-gold bg-gold/10 text-gold">
        <TokenIcon symbol={symbol} size={32} />
      </div>
      <h2 className="text-xl font-bold tracking-tight text-text">Connect your wallet</h2>
      <p className="mt-2 max-w-xs text-sm leading-relaxed text-text-muted">{message}</p>
      <ConnectButton className="mt-5 w-full max-w-sm" size="lg" />
    </div>
  )
}
