import { Provider } from '@ethersproject/abstract-provider'
import { formatUnits } from '@ethersproject/units'
import { batch, Context, contract } from '@pooltogether/etherplex'
import { amountMultByUsd, SECONDS_PER_DAY } from '@pooltogether/utilities'
import { getReadProvider } from '@pooltogether/wallet-connection'
import { BigNumber } from 'ethers'
import { useQuery } from 'react-query'

import { ERC20Abi } from '../../abis/ERC20Abi'
import { TokenFaucetAbi } from '../../abis/TokenFaucet_3_3_12'
import { Token, TokenWithUsdBalance } from '../../types/token'
import { getCoingeckoTokenPrices } from '../coingecko/useCoingeckoTokenPrices'
import { V3PrizePool } from './useV3PrizePools'

export const useTokenFaucetData = (
  chainId: number,
  tokenFaucetAddress: string,
  prizePool: V3PrizePool,
  underlyingToken: TokenWithUsdBalance
) => {
  const enabled = !!underlyingToken?.usdPerToken

  return useQuery(
    ['useTokenFaucetData', chainId, tokenFaucetAddress],
    () => getTokenFaucetData(chainId, tokenFaucetAddress, prizePool, underlyingToken),
    { enabled }
  )
}

const getTokenFaucetData = async (
  chainId: number,
  tokenFaucetAddress: string,
  prizePool: V3PrizePool,
  underlyingToken: TokenWithUsdBalance
) => {
  const provider = getReadProvider(chainId)
  let batchRequests: Context[] = []

  // Fetch data from token faucet
  const tokenFaucetContract = contract(tokenFaucetAddress, TokenFaucetAbi, tokenFaucetAddress)
  batchRequests.push(
    tokenFaucetContract
      .dripRatePerSecond()
      .measure()
      .asset()
      .totalUnclaimed()
  )
  const tokenFaucetResults = await batch(provider, ...batchRequests)
  batchRequests = []

  const dripTokenAddress: string = tokenFaucetResults[tokenFaucetAddress].asset[0]
  const measureTokenAddress: string = tokenFaucetResults[tokenFaucetAddress].measure[0]

  // Fetch data from tokens
  const dripTokenContract = contract(dripTokenAddress, ERC20Abi, dripTokenAddress)
  const measureTokenContract = contract(measureTokenAddress, ERC20Abi, measureTokenAddress)
  batchRequests.push(
    dripTokenContract
      .name()
      .symbol()
      .decimals()
      .balanceOf(tokenFaucetAddress),
    measureTokenContract.totalSupply()
  )
  const tokenResults = await batch(provider, ...batchRequests)
  batchRequests = []

  const measureToken: Token = getMeasureToken(measureTokenAddress, prizePool)
  const dripToken: Token = {
    address: dripTokenAddress,
    decimals: tokenResults[dripTokenAddress].decimals[0],
    name: tokenResults[dripTokenAddress].name[0],
    symbol: tokenResults[dripTokenAddress].symbol[0]
  }

  try {
    // Fetch drip token price
    const tokenPrices = await getCoingeckoTokenPrices(chainId, [dripTokenAddress])

    const dripTokenValueUsd = tokenPrices[dripTokenAddress].usd

    const dripRatePerSecondUnformatted: BigNumber =
      tokenFaucetResults[tokenFaucetAddress].dripRatePerSecond[0]
    const dripRatePerDayUnformatted = dripRatePerSecondUnformatted.mul(SECONDS_PER_DAY)
    const dripRatePerSecond: string = formatUnits(dripRatePerSecondUnformatted, dripToken.decimals)

    const totalUnclaimedUnformatted: BigNumber =
      tokenFaucetResults[tokenFaucetAddress].totalUnclaimed[0]

    const faucetsDripTokenBalanceUnformatted: BigNumber =
      tokenResults[dripTokenAddress].balanceOf[0]

    const remainingDripTokenBalanceUnformatted = faucetsDripTokenBalanceUnformatted.sub(
      totalUnclaimedUnformatted
    )

    let remainingDaysUnformatted = remainingDripTokenBalanceUnformatted
      .mul(100)
      .div(dripRatePerDayUnformatted)
    const remainingDays = Number(remainingDaysUnformatted.toString()) / 100
    remainingDaysUnformatted = remainingDaysUnformatted.div(100)

    const measureTokenTotalSupplyUnformatted = tokenResults[measureTokenAddress].totalSupply[0]

    const totalDripPerDay = Number(dripRatePerSecond) * SECONDS_PER_DAY
    const totalDripDailyValue = totalDripPerDay * dripTokenValueUsd

    const totalMeasureTokenValueUsdUnformatted = amountMultByUsd(
      measureTokenTotalSupplyUnformatted,
      underlyingToken.usdPerToken
    )
    const totalMeasureTokenValueUsd = Number(
      formatUnits(totalMeasureTokenValueUsdUnformatted, measureToken.decimals)
    )

    let vapr: number = 0
    if (remainingDays > 0) {
      vapr = (totalDripDailyValue / totalMeasureTokenValueUsd) * 365 * 100
    }

    return {
      vapr,
      dripToken,
      dripTokenValueUsd,
      measureToken,
      measureTokenValueUsd: underlyingToken.usdPerToken
    }
  } catch (e) {
    return {
      vapr: 0,
      dripToken,
      dripTokenValueUsd: 0,
      measureToken,
      measureTokenValueUsd: underlyingToken.usdPerToken
    }
  }
}

/**
 * Returns the measure token from the prize pool
 * @param measureTokenAddress
 * @param prizePool
 * @returns
 */
const getMeasureToken = (measureTokenAddress: string, prizePool: V3PrizePool): Token => {
  if (measureTokenAddress === prizePool.addresses.sponsorship) {
    return prizePool.tokens.sponsorship
  }
  return prizePool.tokens.ticket
}
