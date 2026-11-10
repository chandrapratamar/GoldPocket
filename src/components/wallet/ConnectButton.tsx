import { useWallet } from '../../wallet/WalletProvider'
import { Button, type ButtonProps } from '../ui/Button'

/** Connect CTA shown only while disconnected; hidden once Nimiq Pay has the account. */
export function ConnectButton({
  className,
  size,
}: {
  className?: string
  size?: ButtonProps['size']
}) {
  const { isConnected, isConnecting, connect, error } = useWallet()

  if (isConnected) return null

  return (
    <div className={className}>
      <Button
        variant="outline"
        size={size}
        onClick={() => void connect()}
        loading={isConnecting}
        className="w-full"
      >
        {isConnecting ? 'Connecting…' : 'Connect wallet'}
      </Button>
      {error ? <p className="mt-2 text-center text-sm text-danger">{error}</p> : null}
    </div>
  )
}
