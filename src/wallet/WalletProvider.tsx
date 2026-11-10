import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { type Address } from 'viem'
import {
  connectWallet,
  getProvider,
  isNimiqPay,
  restoreConnection,
  switchToPolygon,
  type WalletState,
} from './connector'

const WalletContext = createContext<{
  isConnected: boolean
  address: Address | null
  chainId: number | null
  isConnecting: boolean
  error: string | null
  connect: () => Promise<void>
  disconnect: () => void
  switchChain: () => Promise<void>
  provider: ReturnType<typeof getProvider> | undefined
} | null>(null)

export function WalletProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<WalletState>({
    isConnected: false,
    address: null,
    chainId: null,
    isConnecting: false,
    error: null,
  })

  const provider = getProvider()

  // Listen for provider events (accountsChanged, chainChanged, disconnect)
  useEffect(() => {
    if (!provider) return

    const handleAccountsChanged = ((accounts: unknown[]) => {
      if (accounts.length === 0) {
        setState((s) => ({ ...s, isConnected: false, address: null, chainId: null }))
      } else {
        setState((s) => ({ ...s, address: accounts[0] as Address }))
      }
    }) as (...args: unknown[]) => void
    const handleChainChanged = ((chainId: unknown) => {
      setState((s) => ({ ...s, chainId: Number(chainId) }))
    }) as (...args: unknown[]) => void
    const handleDisconnect = (() => {
      setState((s) => ({ ...s, isConnected: false, address: null, chainId: null }))
    }) as (...args: unknown[]) => void

    provider.on?.('accountsChanged' as string, handleAccountsChanged)
    provider.on?.('chainChanged' as string, handleChainChanged)
    provider.on?.('disconnect' as string, handleDisconnect)

    return () => {
      provider.removeListener?.('accountsChanged', handleAccountsChanged)
      provider.removeListener?.('chainChanged', handleChainChanged)
      provider.removeListener?.('disconnect', handleDisconnect)
    }
  }, [provider])

  const connect = useCallback(async () => {
    setState((s) => ({ ...s, isConnecting: true, error: null }))
    try {
      const { address, chainId } = await connectWallet()
      setState({ isConnected: true, address, chainId, isConnecting: false, error: null })
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to connect wallet.'
      setState((s) => ({ ...s, isConnecting: false, error: message }))
    }
  }, [])

  const disconnect = useCallback(() => {
    setState({ isConnected: false, address: null, chainId: null, isConnecting: false, error: null })
  }, [])

  const switchChain = useCallback(async () => {
    const p = getProvider()
    if (!p) return
    try {
      await switchToPolygon(p)
      setState((s) => ({ ...s, chainId: 137, error: null }))
    } catch (err) {
      setState((s) => ({
        ...s,
        error: err instanceof Error ? err.message : 'Failed to switch chain.',
      }))
    }
  }, [])

  // Connect automatically on load: restore an existing session silently, and inside
  // Nimiq Pay request the account right away so users never see a "Connect" step.
  const autoConnectTried = useRef(false)
  useEffect(() => {
    if (autoConnectTried.current) return
    autoConnectTried.current = true
    void (async () => {
      try {
        const existing = await restoreConnection()
        if (existing) {
          setState({ isConnected: true, ...existing, isConnecting: false, error: null })
        } else if (isNimiqPay()) {
          await connect()
        }
      } catch {
        /* the manual Connect button stays available */
      }
    })()
  }, [connect])

  const value = {
    ...state,
    connect,
    disconnect,
    switchChain,
    provider,
  }

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>
}

export function useWallet() {
  const context = useContext(WalletContext)
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider')
  }
  return context
}
