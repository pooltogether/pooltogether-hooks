import { parseUnits } from '@ethersproject/units'
import { BigNumber } from 'ethers'

import {
  SIMPLE_PRICES_CHAIN_ID_MAP,
  useCoingeckoSimplePrices
} from '../coingecko/useCoingeckoSimplePrices'
import { useGasCosts } from './useGasCosts'

// Makes use of Coingecko for USD prices (of ether, matic, etc) and PoolTogether's gas API result
// to calculate how much gas will probably cost in both USD and the native currency
export const useGasCostEstimate = (gasAmount: BigNumber, chainId: number) => {
  const {
    data: prices,
    isFetched: pricesIsFetched,
    error: pricesError
  } = useCoingeckoSimplePrices()

  const { data: gasCosts, isFetched: gasCostsIsFetched, error: gasCostsError } = useGasCosts(
    chainId
  )

  const isFetched = pricesIsFetched && gasCostsIsFetched
  const error = gasCostsError || pricesError

  let totalGasUsd, totalGasWei
  if (gasCosts && Boolean(prices) && isFetched && !error) {
    totalGasWei = calculateTotalGasWei(gasCosts, gasAmount)
    totalGasUsd = calculateTotalGasUsd(prices, chainId, totalGasWei)
  }

  return { totalGasWei, totalGasUsd, isFetched, error }
}

const calculateTotalGasUsd = (prices, chainId, totalGasWei) => {
  const { usd } = prices[SIMPLE_PRICES_CHAIN_ID_MAP[chainId]]
  return totalGasWei.mul(Math.round(usd * 100).toString()).div(100)
}

const calculateTotalGasWei = (gasCosts, gasAmount) => {
  const standardGasCostGwei = Number(gasCosts.ProposeGasPrice)

  // Convert gwei to wei
  const standardGasCostWei = BigNumber.from(Math.round(standardGasCostGwei * 1000))
    .mul(parseUnits('1', 9))
    .div(1000)

  return gasAmount.mul(standardGasCostWei)
}
