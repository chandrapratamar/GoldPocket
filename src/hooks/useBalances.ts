import { useQuery } from '@tanstack/react-query'
import { formatEther, type Address } from 'viem'
import { fetchTokenBalance, fetchTokenDecimals, PAXG_TOKEN, USDT_TOKEN } from '../blockchain/tokens'
import { formatEtherValue, publicClient } from '../blockchain/client'

interface TokenBalance {
  token: typeof USDT_TOKEN
  balance: bigint
  decimals: number
  formatted: string
}

interface BalancesData {
  usdt: TokenBalance
  paxg: TokenBalance
  /** Native POL — needed for network fees. */
  pol: { balance: bigint; formatted: string }
}

async function fetchBalances(address: Address): Promise<BalancesData> {
  const [usdtBalance, usdtDecimals, paxgBalance, paxgDecimals, polBalance] = await Promise.all([
    fetchTokenBalance(USDT_TOKEN, address),
    fetchTokenDecimals(USDT_TOKEN),
    fetchTokenBalance(PAXG_TOKEN, address),
    fetchTokenDecimals(PAXG_TOKEN),
    publicClient.getBalance({ address }),
  ])

  return {
    usdt: {
      token: USDT_TOKEN,
      balance: usdtBalance,
      decimals: usdtDecimals,
      formatted: formatEtherValue(usdtBalance, usdtDecimals),
    },
    paxg: {
      token: PAXG_TOKEN,
      balance: paxgBalance,
      decimals: paxgDecimals,
      formatted: formatEtherValue(paxgBalance, paxgDecimals),
    },
    pol: { balance: polBalance, formatted: formatEther(polBalance) },
  }
}

export function useBalances(address: Address | null) {
  return useQuery({
    queryKey: ['balances', address],
    queryFn: () => {
      if (!address) throw new Error('No address')
      return fetchBalances(address)
    },
    enabled: !!address,
    staleTime: 10_000,
    refetchOnWindowFocus: true,
    refetchOnMount: true,
  })
}
