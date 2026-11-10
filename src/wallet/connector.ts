import { type Address } from 'viem'

export interface WalletState {
  isConnected: boolean
  address: Address | null
  chainId: number | null
  isConnecting: boolean
  error: string | null
}

interface EIP1193Provider {
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>
  on?: (event: string, handler: (...args: unknown[]) => void) => void
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void
}

export function getProvider(): EIP1193Provider | undefined {
  return (window as unknown as { ethereum?: EIP1193Provider }).ethereum
}

export function isNimiqPay(): boolean {
  return (
    typeof window !== 'undefined' &&
    typeof (window as unknown as { nimiqPay?: unknown }).nimiqPay !== 'undefined'
  )
}

/** Connect to the injected EIP-1193 provider and switch to Polygon. */
export async function connectWallet(): Promise<{ address: Address; chainId: number }> {
  const provider = getProvider()
  if (!provider) {
    throw new Error('No wallet provider found. Open this mini app inside Nimiq Pay.')
  }

  const accounts = (await provider.request({
    method: 'eth_requestAccounts',
    params: [],
  })) as Address[]

  if (accounts.length === 0) {
    throw new Error('No accounts returned by the wallet.')
  }

  const address = accounts[0]
  await switchToPolygon(provider)

  return { address, chainId: 137 }
}

/** Switch to Polygon PoS (chain ID 0x89 / 137), adding it if needed. */
export async function switchToPolygon(provider: EIP1193Provider): Promise<void> {
  try {
    await provider.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: '0x89' }],
    })
  } catch (err: unknown) {
    const switchError = err as { code?: number; message?: string }
    // 4902 = chain not added to wallet yet
    if (switchError.code === 4902) {
      await provider.request({
        method: 'wallet_addEthereumChain',
        params: [
          {
            chainId: '0x89',
            chainName: 'Polygon PoS',
            nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
            rpcUrls: ['https://polygon-rpc.com'],
            blockExplorerUrls: ['https://polygonscan.com'],
          },
        ],
      })
    } else {
      throw err
    }
  }
}

/** Reads an already-authorised account without prompting the user. */
export async function restoreConnection(): Promise<{ address: Address; chainId: number } | null> {
  const provider = getProvider()
  if (!provider) return null
  const accounts = (await provider.request({ method: 'eth_accounts' })) as Address[]
  if (accounts.length === 0) return null
  const hexChainId = (await provider.request({ method: 'eth_chainId' })) as string
  return { address: accounts[0], chainId: Number.parseInt(hexChainId, 16) }
}
