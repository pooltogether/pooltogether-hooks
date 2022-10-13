import { Provider } from '@ethersproject/abstract-provider'
import { parseUnits } from '@ethersproject/units'
import { batch, Context, contract } from '@pooltogether/etherplex'
import {
  amountMultByUsd,
  toScaledUsdBigNumber,
  getAmountFromUnformatted
} from '@pooltogether/utilities'
import { useQueries } from 'react-query'
import { PodToken, useV3PrizePools, V3PrizePool } from './useV3PrizePools'
import { Amount, Token, TokenPrice, TokenWithUsdBalance } from '../../types/token'
import { useCoingeckoTokenPricesAcrossChains } from '../coingecko/useCoingeckoTokenPrices'
import { ERC20Abi } from '../../abis/ERC20Abi'
import { BigNumber } from 'ethers'
import { getReadProviders } from '@pooltogether/wallet-connection'

/**
 * Fetch users balances for all tokens in all prize pools
 * @param usersAddress
 * @returns
 */
export const useAllUsersV3Balances = (usersAddress: string) => {
  const { data: v3PrizePools, isFetched } = useV3PrizePools()
  const chainIds = isFetched ? Object.keys(v3PrizePools).map(Number) : []
  const providers = getReadProviders(chainIds)
  const {
    data: tokenPrices,
    isFetched: isTokenPricesFetched
  } = useCoingeckoTokenPricesAcrossChains(getTokenAddressesFromPrizePools(v3PrizePools))

  return useQueries(
    chainIds.map((chainId) => ({
      queryKey: ['useAllUsersV3Balances', usersAddress, chainId, tokenPrices],
      queryFn: () =>
        getUserV3BalancesByChainId(
          chainId,
          usersAddress,
          providers[chainId],
          v3PrizePools[chainId],
          tokenPrices
        ),
      enabled: isFetched && isTokenPricesFetched && Boolean(usersAddress)
    }))
  )
}

/**
 * Fetch balances for user for all tokens
 * @param chainId
 * @param usersAddress
 * @param provider
 * @param prizePools
 * @returns
 */
const getUserV3BalancesByChainId = async (
  chainId: number,
  usersAddress: string,
  provider: Provider,
  prizePools: V3PrizePool[],
  tokenPrices: {
    [id: string]: TokenPrice
  }
) => {
  let batchRequests: Context[] = []

  // Fetch balances
  prizePools.forEach((prizePool) => {
    const { ticket, token, sponsorship, podStablecoin } = prizePool.tokens

    const tokenContract = contract(token.address, ERC20Abi, token.address)
    const ticketContract = contract(ticket.address, ERC20Abi, ticket.address)
    const sponsorshipContract = contract(sponsorship.address, ERC20Abi, sponsorship.address)
    const podStablecoinContract = podStablecoin
      ? contract(podStablecoin.address, ERC20Abi, podStablecoin.address)
      : null

    batchRequests.push(
      tokenContract.balanceOf(usersAddress),
      ticketContract.balanceOf(usersAddress),
      sponsorshipContract.balanceOf(usersAddress)
    )
    if (!!podStablecoinContract) {
      batchRequests.push(podStablecoinContract.balanceOf(usersAddress))
    }
  })
  const balanceOfResults = await batch(provider, ...batchRequests)

  // Format balances, merge USD data
  const balances: {
    chainId: number
    ticket: TokenWithUsdBalance
    token: TokenWithUsdBalance
    prizePool: V3PrizePool
    pricePerShare?: Amount
    isPod?: boolean
    isSponsorship?: boolean
  }[] = []

  prizePools.forEach((prizePool) => {
    const { ticket, token, sponsorship, podStablecoin } = prizePool.tokens

    const tokenUsd = tokenPrices?.[token.address]?.usd
    const tokenWithUsdBalance = makeTokenWithUsdBalance(token, tokenUsd, balanceOfResults)
    const ticketWithUsdBalance = makeTokenWithUsdBalance(ticket, tokenUsd, balanceOfResults)
    const sponsorshipWithUsdBalance = makeTokenWithUsdBalance(
      sponsorship,
      tokenUsd,
      balanceOfResults
    )
    const podStablecoinWithUsdBalance = podStablecoin
      ? makePodStablecoinTokenWithUsdBalance(podStablecoin, tokenUsd, balanceOfResults)
      : null

    const ticketBalance = {
      chainId,
      ticket: ticketWithUsdBalance,
      token: tokenWithUsdBalance,
      prizePool
    }
    const sponsorshipBalance = {
      chainId,
      ticket: sponsorshipWithUsdBalance,
      token: tokenWithUsdBalance,
      prizePool,
      isSponsorship: true
    }
    const podBalance = podStablecoinWithUsdBalance
      ? {
          chainId,
          ticket: podStablecoinWithUsdBalance,
          token: tokenWithUsdBalance,
          prizePool,
          pricePerShare: podStablecoin.pricePerShare,
          isPod: true
        }
      : null

    balances.push(ticketBalance, sponsorshipBalance)
    if (podBalance) {
      balances.push(podBalance)
    }
  })

  return {
    chainId,
    balances: balances,
    isTokenPricesFetched: Boolean(tokenPrices)
  }
}

/**
 * Format data. Calculate USD value of token balance.
 * @param token
 * @param usdPerToken
 * @param etherplexBalanceOfResults
 * @returns
 */
const makeTokenWithUsdBalance = (
  token: Token,
  usdPerToken: number,
  etherplexBalanceOfResults
): TokenWithUsdBalance => {
  const balanceUnformatted = etherplexBalanceOfResults[token.address].balanceOf[0]
  const balance = getAmountFromUnformatted(balanceUnformatted, token.decimals)
  const balanceUsdUnformatted = usdPerToken
    ? amountMultByUsd(balanceUnformatted, usdPerToken)
    : BigNumber.from(0)
  const balanceUsd = getAmountFromUnformatted(balanceUsdUnformatted, token.decimals)
  const balanceUsdScaled = toScaledUsdBigNumber(balanceUsd.amount)
  return {
    ...token,
    ...balance,
    usdPerToken,
    balanceUsd,
    balanceUsdScaled,
    hasBalance: !balance.amountUnformatted.isZero()
  }
}

/**
 * Format data. Calculate USD value of token balance.
 * Converts balance of pod stablecoin to the amount of the underlying token then multiplies by price.
 * @param token
 * @param usdPerToken
 * @param etherplexBalanceOfResults
 * @returns
 */
const makePodStablecoinTokenWithUsdBalance = (
  token: PodToken,
  usdPerToken: number,
  etherplexBalanceOfResults
): TokenWithUsdBalance => {
  const balanceUnformatted = etherplexBalanceOfResults[token.address].balanceOf[0]
  const balance = getAmountFromUnformatted(balanceUnformatted, token.decimals)
  const balanceUsdUnformatted = usdPerToken
    ? amountMultByUsd(
        balanceUnformatted
          .mul(parseUnits('1', token.decimals))
          .mul(token.pricePerShare.amountUnformatted)
          .div(parseUnits('1', token.decimals))
          .div(parseUnits('1', token.decimals)),
        usdPerToken
      )
    : BigNumber.from(0)
  const balanceUsd = getAmountFromUnformatted(balanceUsdUnformatted, token.decimals)
  const balanceUsdScaled = toScaledUsdBigNumber(balanceUsd.amount)
  return {
    ...token,
    ...balance,
    usdPerToken,
    balanceUsd,
    balanceUsdScaled,
    hasBalance: !balance.amountUnformatted.isZero()
  }
}

/**
 * Pulls token addresses from prize pools
 * @param v3PrizePools
 * @returns
 */
const getTokenAddressesFromPrizePools = (v3PrizePools: { [chainId: number]: V3PrizePool[] }) => {
  return (
    !!v3PrizePools &&
    Object.keys(v3PrizePools).reduce((tokens, chainId) => {
      tokens[Number(chainId)] = v3PrizePools[Number(chainId)].map(
        (prizePool) => prizePool.tokens.token.address
      )
      return tokens
    }, {} as { [chainId: number]: string[] })
  )
}
