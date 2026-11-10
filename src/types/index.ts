/** Hex-quantity EVM address (`0x`-prefixed). */
export type Address = `0x${string}`

export interface TokenInfo {
  address: Address
  symbol: string
  name: string
  chainId: number
  /**
   * Token decimals are read from the token contract at runtime and must not be
   * assumed. `null` until the first successful contract read.
   */
  decimals: number | null
}

export interface GoldQuote {
  /** Spot price of one troy ounce of gold. */
  pricePerTroyOunce: number
  currency: 'USD'
  /** Host of the upstream price source. */
  source: string
  /** ISO-8601 timestamp of when the quote was fetched upstream. */
  fetchedAt: string
}

export type QuoteErrorCode =
  'quotes_not_configured' | 'upstream_unavailable' | 'unexpected_response'

/** How the user prefers to see gold weight. */
export type GoldUnit = 'g' | 'oz'

export type TradeSide = 'buy' | 'sell'
