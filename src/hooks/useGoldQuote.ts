import { useQuery } from '@tanstack/react-query'
import { fetchGoldQuote } from '../pricing/quoteClient'

const STALE_TIME_MS = 10_000
const REFRESH_INTERVAL_MS = 20_000

export function useGoldQuote() {
  return useQuery({
    queryKey: ['gold-quote'],
    queryFn: ({ signal }) => fetchGoldQuote(signal),
    staleTime: STALE_TIME_MS,
    refetchInterval: REFRESH_INTERVAL_MS,
    retry: 1,
  })
}
