import type { Address } from 'viem'
import type { TradeSide } from '../types'

/** Progress reported to the UI while a trade is running. */
export type TradeStep = 'quote' | 'approve' | 'swap'

export type TradeErrorCode = 'rejected' | 'slippage' | 'failed' | 'unavailable'

export class TradeError extends Error {
  readonly code: TradeErrorCode

  constructor(code: TradeErrorCode, message: string) {
    super(message)
    this.name = 'TradeError'
    this.code = code
  }
}

export interface TradeRequest {
  side: TradeSide
  /** Amount of the token being spent, in whole units: USDT for a buy, PAXG for a sell. */
  amount: number
  fromAddress: Address
  slippagePct: number
}

export interface TradeOutcome {
  txHash: string | undefined
  /** Amount of the token received, in whole units: PAXG for a buy, USDT for a sell. */
  receivedAmount?: number
  provider?: 'lifi' | '1inch'
}
