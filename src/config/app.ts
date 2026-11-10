export const app = {
  name: 'Gold Pocket',
  version: '0.1.0',
} as const

const rawQuotesBaseUrl = import.meta.env.VITE_QUOTES_API_BASE_URL ?? ''

/** Base URL of the quotes API (no trailing slash). Empty means same-origin. */
export const quotesApiBaseUrl = rawQuotesBaseUrl.replace(/\/+$/, '')
