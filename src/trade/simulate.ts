import { TradeError, type TradeOutcome, type TradeRequest, type TradeStep } from './types'

/**
 * Local simulator. Kept as an explicit opt-in (`VITE_SIMULATED_TRADES=true`) so the full
 * review → approve → swap flow can be previewed without sending transactions.
 * Real execution lives in `src/trade/execute.ts`.
 */

type SimMode = 'ok' | 'reject' | 'slippage' | 'fail'

/**
 * In dev builds, append `?sim=reject`, `?sim=slippage` or `?sim=fail` to the trade URL to preview
 * each failure state without touching a wallet. Production builds always succeed.
 */
function getSimMode(): SimMode {
  if (!import.meta.env.DEV) return 'ok'
  const value = new URLSearchParams(window.location.search).get('sim')
  return value === 'reject' || value === 'slippage' || value === 'fail' ? value : 'ok'
}

const wait = (ms: number) => new Promise<void>((resolve) => window.setTimeout(resolve, ms))

export async function runSimulatedTrade(
  _request: TradeRequest,
  onStep: (step: TradeStep) => void,
): Promise<TradeOutcome> {
  const mode = getSimMode()

  onStep('quote')
  await wait(700)

  onStep('approve')
  await wait(1400)
  if (mode === 'reject') {
    throw new TradeError('rejected', 'The request was cancelled in your wallet.')
  }

  onStep('swap')
  await wait(1800)
  if (mode === 'slippage') {
    throw new TradeError('slippage', 'The price moved more than your slippage setting allows.')
  }
  if (mode === 'fail') {
    throw new TradeError('failed', 'The transaction could not be completed.')
  }

  return { txHash: undefined }
}
