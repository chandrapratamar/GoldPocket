import type { VercelRequest, VercelResponse } from '@vercel/node'

// Inlined from src/types so the serverless function has no runtime dependency
// on the src/ tree (which is not deployed to Vercel's runtime).
interface GoldQuote {
  pricePerTroyOunce: number
  currency: 'USD'
  source: string
  fetchedAt: string
}

const CACHE_CONTROL = 'public, max-age=0, s-maxage=60, stale-while-revalidate=300'
const UPSTREAM_TIMEOUT_MS = 8_000

function setCorsHeaders(res: VercelResponse): void {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
}

function isValidUpstreamPayload(payload: unknown): payload is { price: number } {
  if (typeof payload !== 'object' || payload === null) return false
  const candidate = payload as Record<string, unknown>
  return (
    typeof candidate.price === 'number' && Number.isFinite(candidate.price) && candidate.price > 0
  )
}

/** Gold spot price proxy. Configure GOLD_PRICE_API_URL; returns 503 until set. */
export default async function handler(req: VercelRequest, res: VercelResponse): Promise<void> {
  setCorsHeaders(res)

  if (req.method === 'OPTIONS') {
    res.status(204).end()
    return
  }

  if (req.method !== 'GET') {
    res.status(405).json({ error: 'method_not_allowed' })
    return
  }

  const upstreamUrl = process.env.GOLD_PRICE_API_URL
  if (!upstreamUrl) {
    res.status(503).json({ error: 'quotes_not_configured' })
    return
  }

  let response: Response
  try {
    response = await fetch(upstreamUrl, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS),
    })
  } catch {
    res.status(502).json({ error: 'upstream_unavailable' })
    return
  }

  if (!response.ok) {
    res.status(502).json({ error: 'upstream_unavailable' })
    return
  }

  const payload: unknown = await response.json()
  if (!isValidUpstreamPayload(payload)) {
    res.status(502).json({ error: 'upstream_unavailable' })
    return
  }

  const quote: GoldQuote = {
    pricePerTroyOunce: payload.price,
    currency: 'USD',
    source: new URL(upstreamUrl).host,
    fetchedAt: new Date().toISOString(),
  }

  res.setHeader('Cache-Control', CACHE_CONTROL)
  res.status(200).json(quote)
}
