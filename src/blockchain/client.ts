import {
  createPublicClient,
  createWalletClient,
  custom,
  fallback,
  http,
  type EIP1193Provider,
} from 'viem'
import { polygon } from 'viem/chains'

/** Minimal EIP-1193 surface exposed by the injected wallet. */
export interface InjectedProvider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
}

/** Polygon RPC endpoints, tried in order. Override with VITE_POLYGON_RPC_URL. */
const rpcUrls = [
  import.meta.env.VITE_POLYGON_RPC_URL,
  'https://polygon-bor-rpc.publicnode.com',
  'https://polygon.llamarpc.com',
  'https://polygon-rpc.com',
].filter((url): url is string => Boolean(url))

/** Read-only client for Polygon — resilient via multiple RPC fallbacks. */
export const publicClient = createPublicClient({
  chain: polygon,
  transport: fallback(
    rpcUrls.map((url) => http(url, { timeout: 10_000 })),
    { rank: false },
  ),
})

export function createWalletClientFromProvider(provider: InjectedProvider) {
  return createWalletClient({
    chain: polygon,
    transport: custom(provider as unknown as EIP1193Provider),
  })
}

export function formatEtherValue(value: bigint, decimals: number): string {
  const decimalsFactor = 10n ** BigInt(decimals)
  const whole = value / decimalsFactor
  const fraction = value % decimalsFactor
  const fractionStr = fraction.toString().padStart(decimals, '0').replace(/0+$/, '')
  return fractionStr === '' ? whole.toString() : `${whole.toString()}.${fractionStr}`
}
