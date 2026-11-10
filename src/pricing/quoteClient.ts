import { quotesApiBaseUrl } from '../config/app'
import type { GoldQuote, QuoteErrorCode } from '../types'

export class QuoteUnavailableError extends Error {
  readonly code: QuoteErrorCode

  constructor(code: QuoteErrorCode, message: string) {
    super(message)
    this.name = 'QuoteUnavailableError'
    this.code = code
  }
}

function isGoldQuote(value: unknown): value is GoldQuote {
  if (typeof value !== 'object' || value === null) return false
  const quote = value as Record<string, unknown>
  return (
    typeof quote.pricePerTroyOunce === 'number' &&
    Number.isFinite(quote.pricePerTroyOunce) &&
    quote.pricePerTroyOunce > 0 &&
    quote.currency === 'USD' &&
    typeof quote.source === 'string' &&
    typeof quote.fetchedAt === 'string'
  )
}

const knownErrorCodes: QuoteErrorCode[] = [
  'quotes_not_configured',
  'upstream_unavailable',
  'unexpected_response',
]

/** Fetches the current gold spot quote from the quotes API. */
export async function fetchGoldQuote(signal?: AbortSignal): Promise<GoldQuote> {
  let response: Response
  try {
    response = await fetch(`${quotesApiBaseUrl}/api/quotes/gold`, {
      headers: { accept: 'application/json' },
      signal,
    })
  } catch {
    throw new QuoteUnavailableError(
      'upstream_unavailable',
      'The gold price service could not be reached.',
    )
  }

  if (!response.ok) {
    let code: QuoteErrorCode = 'upstream_unavailable'
    try {
      const body = (await response.json()) as Partial<{ error: QuoteErrorCode }>
      if (body.error && knownErrorCodes.includes(body.error)) code = body.error
    } catch {
      code = 'upstream_unavailable'
    }
    throw new QuoteUnavailableError(
      code,
      `The gold price service responded with ${response.status}.`,
    )
  }

  const payload: unknown = await response.json()
  if (!isGoldQuote(payload)) {
    throw new QuoteUnavailableError(
      'unexpected_response',
      'The gold price service returned an unexpected payload.',
    )
  }
  return payload
}
