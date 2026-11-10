import type { VercelRequest, VercelResponse } from '@vercel/node'
import {
  PAXG_ADDRESS,
  PAXG_DECIMALS,
  POLYGON_CHAIN_ID,
  USDT_ADDRESS,
  USDT_DECIMALS,
} from '../../src/config/contracts'

const UPSTREAM_TIMEOUT_MS = 12_000
/** 1inch v6 router — the spender its swap calldata expects approval for. */
const ONEINCH_ROUTER = '0x111111125421cA6dc452d289314280a0f8842A65'
const ADDRESS_RE = /^0x[0-9a-fA-F]{40}$/
const HEX_RE = /^0x[0-9a-fA-F]*$/

type Side = 'buy' | 'sell'
type Provider = 'lifi' | '1inch'

interface QuoteRequest {
  side: Side
  amount: number
  fromAddress: string
  slippagePct: number
}

interface UpstreamParams {
  side: Side
  fromToken: string
  toToken: string
  fromDecimals: number
  toDecimals: number
  fromAmount: string
  fromAddress: string
  slippagePct: number
}

interface NormalizedQuote {
  provider: Provider
  side: Side
  fromToken: string
  toToken: string
  fromDecimals: number
  toDecimals: number
  fromAmount: string
  toAmount: string
  toAmountMin: string
  approvalAddress: string
  transaction: {
    to: string
    data: string
    value: string
    gasLimit?: string
  }
  feeUsd?: number
  gasUsd?: number
}

/** Describes how the returned quote was chosen when several providers answered. */
interface Routing {
  /** Providers that returned a usable quote for this request. */
  compared: Provider[]
  /** Best non-winning provider, when one was available. */
  runnerUp?: Provider
  /** How much more the winner returns than the runner-up, in basis points. */
  advantageBps?: number
}

interface LifiQuote {
  estimate?: {
    toAmount?: string
    toAmountMin?: string
    approvalAddress?: string
    feeCosts?: { amountUSD?: string }[]
    gasCosts?: { amountUSD?: string }[]
  }
  transactionRequest?: {
    to?: string
    data?: string
    value?: string
    gasLimit?: string
  }
}

interface OneInchSwap {
  dstAmount?: string
  tx?: {
    to?: string
    data?: string
    value?: string
    gas?: string
  }
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null
}

function setCorsHeaders(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

/** Converts a whole-unit amount (e.g. 10.5 USDT) to base units without floating-point strings. */
function toBaseUnits(amount: number, decimals: number): string {
  const [whole, fraction = ''] = amount.toFixed(decimals).split('.')
  return `${whole}${fraction.padEnd(decimals, '0')}`.replace(/^0+(?=\d)/, '')
}

/** Accepts both hex ("0x0") and decimal ("0") wei strings. */
function toDecimalWei(value: string | undefined): string {
  return value ? BigInt(value).toString() : '0'
}

function sumUsd(items: { amountUSD?: string }[] | undefined): number | undefined {
  if (!items?.length) return undefined
  let total = 0
  for (const item of items) {
    const value = Number(item.amountUSD)
    if (Number.isFinite(value)) total += value
  }
  return total > 0 ? total : undefined
}

function parseBody(raw: unknown): QuoteRequest | null {
  if (!isRecord(raw)) return null

  const side = raw.side
  if (side !== 'buy' && side !== 'sell') return null

  const amount = typeof raw.amount === 'string' ? Number(raw.amount) : raw.amount
  if (typeof amount !== 'number' || !Number.isFinite(amount) || amount <= 0) return null

  const fromAddress = raw.fromAddress
  if (typeof fromAddress !== 'string' || !ADDRESS_RE.test(fromAddress)) return null

  const slippagePct =
    typeof raw.slippagePct === 'string' ? Number(raw.slippagePct) : raw.slippagePct
  if (
    typeof slippagePct !== 'number' ||
    !Number.isFinite(slippagePct) ||
    slippagePct <= 0 ||
    slippagePct > 50
  ) {
    return null
  }

  return { side, amount, fromAddress, slippagePct }
}

async function fetchLifi(params: UpstreamParams): Promise<NormalizedQuote> {
  const url = new URL('https://li.quest/v1/quote')
  url.searchParams.set('fromChain', String(POLYGON_CHAIN_ID))
  url.searchParams.set('toChain', String(POLYGON_CHAIN_ID))
  url.searchParams.set('fromToken', params.fromToken)
  url.searchParams.set('toToken', params.toToken)
  url.searchParams.set('fromAmount', params.fromAmount)
  url.searchParams.set('fromAddress', params.fromAddress)
  url.searchParams.set('slippage', String(params.slippagePct / 100))
  url.searchParams.set('integrator', 'gold-pocket')

  const apiKey = process.env.LIFI_API_KEY?.trim()
  const request = (headers: Record<string, string>) =>
    fetch(url, { headers, signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) })

  let response = await request(
    apiKey
      ? { accept: 'application/json', 'x-lifi-api-key': apiKey }
      : { accept: 'application/json' },
  )
  // Li.Fi's public tier works without a key, so an expired key should not break quoting.
  if (apiKey && (response.status === 401 || response.status === 403)) {
    response = await request({ accept: 'application/json' })
  }
  if (!response.ok) throw new Error(`Li.Fi responded with ${response.status}.`)

  const data = (await response.json()) as LifiQuote
  const estimate = data.estimate
  const tx = data.transactionRequest
  if (!estimate?.toAmount || !tx?.to || !tx.data) {
    throw new Error('Li.Fi returned no executable route.')
  }
  if (!ADDRESS_RE.test(tx.to) || !HEX_RE.test(tx.data)) {
    throw new Error('Li.Fi returned an invalid transaction.')
  }

  const approvalAddress = estimate.approvalAddress ?? tx.to
  if (!ADDRESS_RE.test(approvalAddress)) {
    throw new Error('Li.Fi returned an invalid approval address.')
  }

  return {
    provider: 'lifi',
    side: params.side,
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromDecimals: params.fromDecimals,
    toDecimals: params.toDecimals,
    fromAmount: params.fromAmount,
    toAmount: BigInt(estimate.toAmount).toString(),
    toAmountMin: BigInt(estimate.toAmountMin ?? estimate.toAmount).toString(),
    approvalAddress,
    transaction: {
      to: tx.to,
      data: tx.data,
      value: toDecimalWei(tx.value),
      gasLimit: tx.gasLimit ? BigInt(tx.gasLimit).toString() : undefined,
    },
    feeUsd: sumUsd(estimate.feeCosts),
    gasUsd: sumUsd(estimate.gasCosts),
  }
}

async function fetchOneInch(params: UpstreamParams): Promise<NormalizedQuote> {
  const apiKey = process.env.ONEINCH_API_KEY?.trim()
  if (!apiKey) throw new Error('1inch is not configured.')

  const base = (process.env.ONEINCH_API_URL?.trim() || 'https://api.1inch.com').replace(/\/+$/, '')
  const url = new URL(`${base}/swap/v6.1/${POLYGON_CHAIN_ID}/swap`)
  url.searchParams.set('src', params.fromToken)
  url.searchParams.set('dst', params.toToken)
  url.searchParams.set('amount', params.fromAmount)
  url.searchParams.set('from', params.fromAddress)
  url.searchParams.set('slippage', String(params.slippagePct))
  // The client checks and grants allowance itself, so skip 1inch's balance/allowance simulation.
  url.searchParams.set('disableEstimate', 'true')

  const response = await fetch(url, {
    headers: { accept: 'application/json', authorization: `Bearer ${apiKey}` },
    signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
  })
  if (!response.ok) throw new Error(`1inch responded with ${response.status}.`)

  const data = (await response.json()) as OneInchSwap
  const tx = data.tx
  if (!data.dstAmount || !tx?.to || !tx.data) {
    throw new Error('1inch returned no executable route.')
  }
  if (!ADDRESS_RE.test(tx.to) || !HEX_RE.test(tx.data)) {
    throw new Error('1inch returned an invalid transaction.')
  }

  const toAmount = BigInt(data.dstAmount)
  // 1inch enforces slippage in calldata; mirror it for the "minimum received" display.
  const minFactor = BigInt(Math.round((1 - params.slippagePct / 100) * 10_000))
  const toAmountMin = (toAmount * minFactor) / 10_000n

  return {
    provider: '1inch',
    side: params.side,
    fromToken: params.fromToken,
    toToken: params.toToken,
    fromDecimals: params.fromDecimals,
    toDecimals: params.toDecimals,
    fromAmount: params.fromAmount,
    toAmount: toAmount.toString(),
    toAmountMin: toAmountMin.toString(),
    approvalAddress: ONEINCH_ROUTER,
    transaction: {
      to: tx.to,
      data: tx.data,
      value: toDecimalWei(tx.value),
      gasLimit: tx.gas ? BigInt(tx.gas).toString() : undefined,
    },
  }
}

/**
 * Orders quotes by what the user actually receives. `toAmount` is already net of
 * provider fees, so the highest output wins; a cheaper gas limit breaks ties.
 * Returns a positive number when `a` is the better quote.
 */
function compareQuotes(a: NormalizedQuote, b: NormalizedQuote): number {
  const outputDiff = BigInt(a.toAmount) - BigInt(b.toAmount)
  if (outputDiff !== 0n) return outputDiff > 0n ? 1 : -1

  const aGas = a.transaction.gasLimit ? BigInt(a.transaction.gasLimit) : null
  const bGas = b.transaction.gasLimit ? BigInt(b.transaction.gasLimit) : null
  if (aGas !== null && bGas !== null && aGas !== bGas) return aGas < bGas ? 1 : -1

  return 0
}

function providerOrder(): Provider[] {
  const configured = process.env.SWAP_PROVIDER?.trim().toLowerCase()
  if (configured === 'lifi') return ['lifi']
  if (configured === '1inch') return ['1inch']

  // Li.Fi works without a key (rate-limited) and aggregates 1inch anyway.
  const order: Provider[] = ['lifi']
  if (process.env.ONEINCH_API_KEY?.trim()) order.push('1inch')
  return order
}

/** Serverless proxy that returns an executable USDT ⇄ PAXG swap quote. */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const body = parseBody(req.body)
  if (!body) {
    res.status(400).json({ error: 'invalid_request' })
    return
  }

  const isBuy = body.side === 'buy'
  const params: UpstreamParams = {
    side: body.side,
    fromToken: isBuy ? USDT_ADDRESS : PAXG_ADDRESS,
    toToken: isBuy ? PAXG_ADDRESS : USDT_ADDRESS,
    fromDecimals: isBuy ? USDT_DECIMALS : PAXG_DECIMALS,
    toDecimals: isBuy ? PAXG_DECIMALS : USDT_DECIMALS,
    fromAmount: toBaseUnits(body.amount, isBuy ? USDT_DECIMALS : PAXG_DECIMALS),
    fromAddress: body.fromAddress,
    slippagePct: body.slippagePct,
  }

  const providers = providerOrder()
  const attempts = await Promise.all(
    providers.map(async (provider) => {
      try {
        const quote = provider === 'lifi' ? await fetchLifi(params) : await fetchOneInch(params)
        return { provider, quote }
      } catch (error) {
        return { provider, error: error instanceof Error ? error.message : 'failed' }
      }
    }),
  )

  const quotes = attempts.filter(
    (attempt): attempt is { provider: Provider; quote: NormalizedQuote } => 'quote' in attempt,
  )

  if (quotes.length === 0) {
    const failures = attempts.map((attempt) => `${attempt.provider}: ${attempt.error}`)
    res.status(502).json({
      error: 'swap_unavailable',
      detail: 'No swap route is available right now. Try a different amount or retry shortly.',
      ...(process.env.NODE_ENV === 'production' ? {} : { providers: failures }),
    })
    return
  }

  // Query every provider, then return only the best executable quote.
  const winner = quotes.reduce((best, current) =>
    compareQuotes(current.quote, best.quote) > 0 ? current : best,
  )
  const runnerUp = quotes
    .filter((entry) => entry !== winner)
    .sort((a, b) => compareQuotes(b.quote, a.quote))[0]

  const routing: Routing = { compared: quotes.map((entry) => entry.provider) }
  if (runnerUp) {
    routing.runnerUp = runnerUp.provider
    const winnerOut = BigInt(winner.quote.toAmount)
    const runnerUpOut = BigInt(runnerUp.quote.toAmount)
    if (runnerUpOut > 0n && winnerOut > runnerUpOut) {
      routing.advantageBps = Number(((winnerOut - runnerUpOut) * 10_000n) / runnerUpOut)
    }
  }

  res.setHeader('Cache-Control', 'no-store')
  res.status(200).json({ ...winner.quote, routing })
}
