import { erc20Abi, type Address } from 'viem'
import { PAXG_ADDRESS, USDT_ADDRESS } from '../config/contracts'
import { publicClient } from './client'

export interface TokenConfig {
  address: Address
  symbol: string
  name: string
  chainId: number
  /** Read from the token contract at runtime — never assumed. */
  decimals: number | null
  image?: string
}

export const USDT_TOKEN: TokenConfig = {
  address: USDT_ADDRESS,
  symbol: 'USDT',
  name: 'Tether USD',
  chainId: 137,
  decimals: null,
  image: '/img/USDT.png',
}

export const PAXG_TOKEN: TokenConfig = {
  address: PAXG_ADDRESS,
  symbol: 'PAXG',
  name: 'PAX Gold',
  chainId: 137,
  decimals: null,
  image: '/img/PAXG.png',
}

export const tradedTokens = [USDT_TOKEN, PAXG_TOKEN] as const

/** Read token decimals from the contract at runtime. */
export async function fetchTokenDecimals(token: TokenConfig): Promise<number> {
  const decimals = await publicClient.readContract({
    address: token.address,
    abi: erc20Abi,
    functionName: 'decimals',
  })
  return decimals as number
}

/** Read token balance from the contract at runtime. */
export async function fetchTokenBalance(token: TokenConfig, address: Address): Promise<bigint> {
  return publicClient.readContract({
    address: token.address,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: [address],
  })
}
