export interface ChainConfig {
  id: number
  hexId: `0x${string}`
  name: string
  nativeCurrency: { name: string; symbol: string; decimals: number }
  explorerUrl: string
}

/** Polygon PoS — the only network Gold Pocket trades on. */
export const polygon: ChainConfig = {
  id: 137,
  hexId: '0x89',
  name: 'Polygon PoS',
  nativeCurrency: { name: 'POL', symbol: 'POL', decimals: 18 },
  explorerUrl: 'https://polygonscan.com',
}
