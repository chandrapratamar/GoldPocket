import { useQuery } from '@tanstack/react-query'
import type { Address } from 'viem'
import { fetchSwapQuote, SwapUnavailableError } from '../trade/swapClient'
import type { TradeSide } from '../types'
import { useDebouncedValue } from './useDebouncedValue'

/** Long enough to respect 1inch's free-tier 1 RPS limit while the user types. */
const DEBOUNCE_MS = 700
const STALE_TIME_MS = 8_000
const GC_TIME_MS = 60_000

/**
 * Live best-of quote for the amount currently on screen. The server compares
 * every configured aggregator and returns only the winner, so this is also the
 * route the trade will use.
 */
export function useSwapQuote({
  side,
  amount,
  fromAddress,
  slippagePct,
  enabled = true,
}: {
  side: TradeSide
  /** Whole units of the token being spent: USDT for a buy, PAXG for a sell. */
  amount: number
  fromAddress: Address | null
  slippagePct: number
  enabled?: boolean
}) {
  const debouncedAmount = useDebouncedValue(amount, DEBOUNCE_MS)
  const ready = enabled && Boolean(fromAddress) && debouncedAmount > 0

  return useQuery({
    queryKey: ['swap-quote', side, debouncedAmount, fromAddress, slippagePct],
    queryFn: () => {
      if (!fromAddress) throw new SwapUnavailableError('Connect your wallet to fetch a quote.')
      return fetchSwapQuote({ side, amount: debouncedAmount, fromAddress, slippagePct })
    },
    enabled: ready,
    staleTime: STALE_TIME_MS,
    gcTime: GC_TIME_MS,
    retry: 0,
    refetchOnWindowFocus: false,
  })
}
