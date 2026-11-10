import type { Address, Hex } from 'viem'
import { quotesApiBaseUrl } from '../config/app'
import type { TradeSide } from '../types'

export interface SwapTransaction {
  to: Address
  data: Hex
  /** Native value in wei. Always 0 for USDT ⇄ PAXG swaps. */
  value: bigint
  gasLimit?: bigint
}

export type SwapProvider = 'lifi' | '1inch'

/** How the server chose this quote when more than one aggregator answered. */
export interface QuoteRouting {
  compared: SwapProvider[]
  runnerUp?: SwapProvider
  /** How much more this quote returns than the runner-up, in basis points. */
  advantageBps?: number
}

/** Normalized executable quote returned by `/api/swap/quote`. */
export interface SwapQuote {
  provider: SwapProvider
  side: TradeSide
  fromToken: Address
  toToken: Address
  fromDecimals: number
  toDecimals: number
  fromAmount: bigint
  toAmount: bigint
  toAmountMin: bigint
  /** Address the input token must be approved for. */
  approvalAddress: Address
  transaction: SwapTransaction
  feeUsd?: number
  gasUsd?: number
  routing?: QuoteRouting
}

export const PROVIDER_LABELS: Record<SwapProvider, string> = {
  lifi: 'LI.FI',
  '1inch': '1inch',
}

export interface SwapQuoteRequest {
  side: TradeSide
  /** Whole units of the token being spent: USDT for a buy, PAXG for a sell. */
  amount: number
  fromAddress: Address
  slippagePct: number
}

export class SwapUnavailableError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SwapUnavailableError'
  }
}

const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/
const HEX_RE = /^0x[0-9a-fA-F]*$/

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function isAddress(value: unknown): value is Address {
  return typeof value === 'string' && ADDRESS_RE.test(value)
}

function isHex(value: unknown): value is Hex {
  return typeof value === 'string' && HEX_RE.test(value)
}

function toBigInt(value: unknown): bigint {
  if (typeof value === 'bigint') return value
  if (typeof value === 'string' || typeof value === 'number') return BigInt(value)
  throw new SwapUnavailableError('The swap service returned an unexpected response.')
}

function optionalNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined
}

function isProvider(value: unknown): value is SwapProvider {
  return value === 'lifi' || value === '1inch'
}

function parseRouting(value: unknown): QuoteRouting | undefined {
  if (!isRecord(value)) return undefined
  const compared = Array.isArray(value.compared) ? value.compared.filter(isProvider) : []
  if (compared.length === 0) return undefined
  return {
    compared,
    runnerUp: isProvider(value.runnerUp) ? value.runnerUp : undefined,
    advantageBps: optionalNumber(value.advantageBps),
  }
}

function parseQuote(payload: unknown): SwapQuote {
  if (!isRecord(payload)) {
    throw new SwapUnavailableError('The swap service returned an unexpected response.')
  }

  const { provider, side, fromToken, toToken, approvalAddress, transaction } = payload
  if (!isProvider(provider)) {
    throw new SwapUnavailableError('The swap service returned an unexpected provider.')
  }
  if (side !== 'buy' && side !== 'sell') {
    throw new SwapUnavailableError('The swap service returned an unexpected side.')
  }
  if (!isAddress(fromToken) || !isAddress(toToken) || !isAddress(approvalAddress)) {
    throw new SwapUnavailableError('The swap service returned invalid token addresses.')
  }
  if (!isRecord(transaction) || !isAddress(transaction.to) || !isHex(transaction.data)) {
    throw new SwapUnavailableError('The swap service returned an invalid transaction.')
  }

  const fromDecimals = payload.fromDecimals
  const toDecimals = payload.toDecimals
  if (
    typeof fromDecimals !== 'number' ||
    !Number.isInteger(fromDecimals) ||
    typeof toDecimals !== 'number' ||
    !Number.isInteger(toDecimals)
  ) {
    throw new SwapUnavailableError('The swap service returned invalid token decimals.')
  }

  return {
    provider,
    side,
    fromToken,
    toToken,
    fromDecimals,
    toDecimals,
    fromAmount: toBigInt(payload.fromAmount),
    toAmount: toBigInt(payload.toAmount),
    toAmountMin: toBigInt(payload.toAmountMin),
    approvalAddress,
    transaction: {
      to: transaction.to,
      data: transaction.data,
      value: toBigInt(transaction.value),
      gasLimit: transaction.gasLimit === undefined ? undefined : toBigInt(transaction.gasLimit),
    },
    feeUsd: optionalNumber(payload.feeUsd),
    gasUsd: optionalNumber(payload.gasUsd),
    routing: parseRouting(payload.routing),
  }
}

/** Fetches an executable swap quote from the serverless aggregator proxy. */
export async function fetchSwapQuote(request: SwapQuoteRequest): Promise<SwapQuote> {
  let response: Response
  try {
    response = await fetch(`${quotesApiBaseUrl}/api/swap/quote`, {
      method: 'POST',
      headers: { 'content-type': 'application/json', accept: 'application/json' },
      body: JSON.stringify(request),
    })
  } catch {
    throw new SwapUnavailableError('The swap service could not be reached.')
  }

  if (!response.ok) {
    let message = 'No swap route is available right now.'
    try {
      const body: unknown = await response.json()
      if (isRecord(body) && typeof body.detail === 'string') message = body.detail
    } catch {
      /* keep the default message */
    }
    throw new SwapUnavailableError(message)
  }

  const payload: unknown = await response.json()
  try {
    return parseQuote(payload)
  } catch (error) {
    if (error instanceof SwapUnavailableError) throw error
    throw new SwapUnavailableError('The swap service returned an unexpected response.')
  }
}
