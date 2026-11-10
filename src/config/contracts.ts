import type { Address } from '../types'

/** The only chain Gold Pocket trades on. */
export const POLYGON_CHAIN_ID = 137

/** USDT (PoS) on Polygon. */
export const USDT_ADDRESS: Address = '0xc2132D05D31c914a87C6611C10748AEb04B58e8F'
/** PAX Gold (bridged) on Polygon. */
export const PAXG_ADDRESS: Address = '0x553d3D295e0f695B9228246232eDF400ed3560B5'

/**
 * Verified against the deployed contracts (`decimals()`). Used by the serverless swap proxy,
 * which cannot read the chain on every request. The UI still reads decimals at runtime.
 */
export const USDT_DECIMALS = 6
export const PAXG_DECIMALS = 18
