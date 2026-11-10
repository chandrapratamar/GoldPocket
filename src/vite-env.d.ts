/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_QUOTES_API_BASE_URL?: string
  readonly VITE_POLYGON_RPC_URL?: string
  /** Set to "true" to run the local trade simulator instead of real swaps. */
  readonly VITE_SIMULATED_TRADES?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
