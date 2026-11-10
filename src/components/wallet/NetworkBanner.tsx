import { polygon } from '../../config/chains'
import { useWallet } from '../../wallet/WalletProvider'
import { Button } from '../ui/Button'
import { Notice } from '../ui/Notice'

/** Shown app-wide when the wallet is connected to a chain other than Polygon. */
export function NetworkBanner() {
  const { isConnected, chainId, switchChain, error } = useWallet()
  if (!isConnected || chainId === null || chainId === polygon.id) return null

  return (
    <Notice variant="warning" title="Wrong network" className="mb-3">
      <p>Gold Pocket works on Polygon. Switch networks to keep trading.</p>
      {error ? <p className="mt-1 text-danger">{error}</p> : null}
      <Button className="mt-3 w-full" onClick={() => void switchChain()}>
        Switch to Polygon
      </Button>
    </Notice>
  )
}
