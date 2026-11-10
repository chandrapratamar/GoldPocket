import { erc20Abi } from 'viem'
import {
  createWalletClientFromProvider,
  publicClient,
  type InjectedProvider,
} from '../blockchain/client'
import { getProvider, switchToPolygon } from '../wallet/connector'
import { fetchSwapQuote, type SwapQuote } from './swapClient'
import { TradeError, type TradeOutcome, type TradeRequest, type TradeStep } from './types'

/** Switches the wallet to Polygon only when it is on another chain. */
async function ensurePolygon(provider: InjectedProvider): Promise<void> {
  const chainId = (await provider.request({ method: 'eth_chainId' })) as string
  if (Number.parseInt(chainId, 16) !== 137) await switchToPolygon(provider)
}

function messageOf(error: unknown): string {
  const candidate = error as { shortMessage?: unknown; message?: unknown }
  if (typeof candidate?.shortMessage === 'string' && candidate.shortMessage) {
    return candidate.shortMessage
  }
  if (typeof candidate?.message === 'string' && candidate.message) return candidate.message
  return ''
}

/** Maps provider/aggregator errors onto the error states the UI understands. */
function toTradeError(error: unknown): TradeError {
  if (error instanceof TradeError) return error

  const code = (error as { code?: unknown })?.code
  const message = messageOf(error)

  if (
    code === 4001 ||
    /user rejected|user denied|rejected the request|request rejected|cancelled by user/i.test(
      message,
    )
  ) {
    return new TradeError('rejected', 'The request was cancelled in your wallet.')
  }

  if (
    /slippage|too little received|insufficient_output_amount|return amount is not enough|price impact too high/i.test(
      message,
    )
  ) {
    return new TradeError('slippage', 'The price moved more than your slippage setting allows.')
  }

  return new TradeError('failed', message || 'The transaction could not be completed.')
}

/**
 * Executes a real USDT ⇄ PAXG swap:
 *   1. fetch an executable quote from the serverless Li.Fi / 1inch proxy,
 *   2. approve the aggregator to spend the input token when the allowance is too low,
 *   3. send the swap through the injected wallet and wait for confirmation.
 *
 * The wallet is the only signer; this module never touches private keys.
 */
export async function runTrade(
  request: TradeRequest,
  onStep: (step: TradeStep) => void,
): Promise<TradeOutcome> {
  const provider = getProvider()
  if (!provider) {
    throw new TradeError(
      'failed',
      'No wallet provider found. Open Gold Pocket inside Nimiq Pay to trade.',
    )
  }

  try {
    await ensurePolygon(provider)
  } catch (error) {
    throw toTradeError(error)
  }

  onStep('quote')
  let quote: SwapQuote
  try {
    quote = await fetchSwapQuote({
      side: request.side,
      amount: request.amount,
      fromAddress: request.fromAddress,
      slippagePct: request.slippagePct,
    })
  } catch (error) {
    throw new TradeError('unavailable', messageOf(error) || 'No swap route is available right now.')
  }

  const wallet = createWalletClientFromProvider(provider)

  let allowance: bigint
  try {
    allowance = await publicClient.readContract({
      address: quote.fromToken,
      abi: erc20Abi,
      functionName: 'allowance',
      args: [request.fromAddress, quote.approvalAddress],
    })
  } catch (error) {
    throw toTradeError(error)
  }

  if (allowance < quote.fromAmount) {
    onStep('approve')
    try {
      const approveHash = await wallet.writeContract({
        account: request.fromAddress,
        address: quote.fromToken,
        abi: erc20Abi,
        functionName: 'approve',
        args: [quote.approvalAddress, quote.fromAmount],
      })
      const approval = await publicClient.waitForTransactionReceipt({ hash: approveHash })
      if (approval.status !== 'success') {
        throw new TradeError('failed', 'The token approval was reverted. Nothing was swapped.')
      }
    } catch (error) {
      throw toTradeError(error)
    }
  }

  onStep('swap')
  let hash: `0x${string}` | undefined
  try {
    // Try with the quote's gas limit first; some wallets reject the explicit
    // gas field, so fall back to wallet-side estimation on failure.
    try {
      hash = await wallet.sendTransaction({
        account: request.fromAddress,
        to: quote.transaction.to,
        data: quote.transaction.data,
        value: quote.transaction.value,
        gas: quote.transaction.gasLimit,
      })
    } catch {
      hash = await wallet.sendTransaction({
        account: request.fromAddress,
        to: quote.transaction.to,
        data: quote.transaction.data,
        value: quote.transaction.value,
      })
    }

    // Public RPCs are flaky; retry the receipt fetch before giving up.
    let receipt: Awaited<ReturnType<typeof publicClient.waitForTransactionReceipt>> | null = null
    let lastError: unknown
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        receipt = await publicClient.waitForTransactionReceipt({
          hash: hash!,
          timeout: 90_000,
          pollingInterval: 2_000,
          confirmations: 1,
        })
        lastError = null
        break
      } catch (error) {
        lastError = error
        // Brief pause before retrying.
        await new Promise((resolve) => setTimeout(resolve, 2_000))
      }
    }

    if (receipt) {
      if (receipt.status !== 'success') {
        throw new TradeError('failed', 'The swap was reverted. Check Activity before retrying.')
      }
    } else {
      // The transaction was broadcast (hash obtained) but we could not confirm it
      // via RPC. It likely succeeded on-chain — return the hash so the user can
      // verify on PolygonScan instead of losing it to a generic error.
      console.error('Swap receipt fetch failed after retries:', lastError, hash)
      return {
        txHash: hash!,
        receivedAmount: Number(quote.toAmount) / 10 ** quote.toDecimals,
        provider: quote.provider,
      }
    }

    return {
      txHash: hash!,
      receivedAmount: Number(quote.toAmount) / 10 ** quote.toDecimals,
      provider: quote.provider,
    }
  } catch (error) {
    const detail = hash ? ` (tx: ${hash})` : ''
    throw toTradeError(error instanceof Error ? new Error(`${error.message}${detail}`) : error)
  }
}
