/**
 * UI-level trade settings.
 *
 * Fee and slippage values are UI estimates; the executable Li.Fi / 1inch quote fetched at
 * confirmation sets the final amounts.
 */

/**
 * While true, the review → approve → swap flow is a local simulation: no transaction is sent
 * and nothing is written on-chain. Set `VITE_SIMULATED_TRADES=true` in your local env to preview
 * the flow without funds. Real trades use the Li.Fi / 1inch executor in `src/trade/execute.ts`.
 */
export const SIMULATED_TRADES = import.meta.env.VITE_SIMULATED_TRADES === 'true'

export const ESTIMATED_NETWORK_FEE_USD = 0.02
export const ESTIMATED_SWAP_FEE_RATE = 0.001

export const DEFAULT_SLIPPAGE_PCT = 0.5
export const SLIPPAGE_OPTIONS = [0.5, 1, 2] as const

/** Minimum POL needed for gas before we let a user start a trade (placeholder). */
export const MIN_POL_FOR_GAS = 0.05

/** How long a displayed rate counts as fresh before the UI asks for a new one. */
export const QUOTE_TTL_SECONDS = 30

/** Trades at or above this USDT value get a "large trade" heads-up. */
export const LARGE_TRADE_USD = 1000

export const BUY_PILL_AMOUNTS = [1, 10, 25] as const
export const SELL_PILL_FRACTIONS = [0.25, 0.5, 0.75] as const
