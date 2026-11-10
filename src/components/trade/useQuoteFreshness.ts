import { useEffect, useReducer } from 'react'
import { QUOTE_TTL_SECONDS } from '../../config/trade'

/** Seconds of freshness left for a rate fetched at `updatedAt` (ms epoch). */
export function useQuoteFreshness(updatedAt: number, ttl: number = QUOTE_TTL_SECONDS) {
  const [, tick] = useReducer((n: number) => n + 1, 0)
  useEffect(() => {
    const id = window.setInterval(tick, 1000)
    return () => window.clearInterval(id)
  }, [])

  const elapsed = updatedAt ? Math.floor((Date.now() - updatedAt) / 1000) : ttl
  const remaining = Math.min(ttl, Math.max(0, ttl - elapsed))
  return { remaining, ttl, expired: remaining === 0 }
}
