import { batch, contract } from '@pooltogether/etherplex'
import { formatUnits } from '@ethersproject/units'
import { useQuery } from 'react-query'
import { numberWithCommas } from '@pooltogether/utilities'
import { PodAbi } from '../abis/PodAbi'

import { QUERY_KEYS } from '../constants'
import { useReadProvider } from './useReadProvider'
import { useRefetchInterval } from './useRefetchInterval'
import { Amount, TokenWithAllBalances } from '../types/token'
import { BigNumber } from 'ethers'
import { getTokenBalances } from './useTokenBalances'

/**
 * Returns a users balance of pod shares and the value of their shares.
 * Includes pod total supply data for calculating conversions between
 * shares and underlying token amounts.
 * @param chainId
 * @param usersAddress
 * @param podAddress
 * @returns
 */
export const usePodShareBalance = (chainId: number, usersAddress: string, podAddress: string) => {
  const refetchInterval = useRefetchInterval()
  const readProvider = useReadProvider(chainId)

  const enabled = Boolean(usersAddress) && Boolean(podAddress) && Boolean(chainId)

  const getCacheKey = (usersAddress, podAddress) => [
    QUERY_KEYS.usersPodBalance,
    chainId,
    usersAddress,
    podAddress
  ]

  return useQuery(
    getCacheKey(usersAddress, podAddress),
    async () => await getPodShareBalance(readProvider, usersAddress, podAddress),
    {
      enabled,
      refetchInterval
    }
  )
}

interface PodShareBalance {
  shares: TokenWithAllBalances
  underlyingAmount: Amount
  pricePerShare: BigNumber
  podUnderlyingTokenBalance: TokenWithAllBalances
  podUnderlyingTicketBalance: TokenWithAllBalances
}

const getPodShareBalance = async (
  readProvider,
  usersAddress,
  podAddress
): Promise<PodShareBalance> => {
  const batchCalls = []
  const podContract = contract(podAddress, PodAbi, podAddress)

  batchCalls.push(
    podContract
      .balanceOf(usersAddress)
      .balanceOfUnderlying(usersAddress)
      .decimals()
      .name()
      .symbol()
      .totalSupply()
      .token()
      .ticket()
      .getPricePerShare()
  )

  const response = await batch(readProvider, ...batchCalls)
  const podResponse = response[podAddress]

  // Fetch balance in float
  const tokenAddress = podResponse.token[0]
  const ticketAddress = podResponse.ticket[0]
  const tokenBalances = await getTokenBalances(readProvider, podAddress, [
    tokenAddress,
    ticketAddress
  ])
  const underlyingTokenBalance = tokenBalances[tokenAddress]
  const underlyingTicketBalance = tokenBalances[ticketAddress]

  const decimals = podResponse.decimals[0]

  const underlyingAmountUnformatted = podResponse.balanceOfUnderlying[0]
  const underlyingAmount = formatUnits(underlyingAmountUnformatted, decimals)
  const underlyingAmountPretty = numberWithCommas(underlyingAmount) as string

  const amountUnformatted = podResponse.balanceOf[0]
  const amount = formatUnits(amountUnformatted, decimals)
  const amountPretty = numberWithCommas(amount) as string
  const name = podResponse.name[0]
  const symbol = podResponse.symbol[0]
  const totalSupplyUnformatted = podResponse.totalSupply[0]
  const totalSupply = formatUnits(totalSupplyUnformatted, decimals)
  const totalSupplyPretty = numberWithCommas(totalSupply) as string
  const pricePerShare = podResponse.getPricePerShare[0]

  return {
    shares: {
      address: podAddress,
      hasBalance: !amountUnformatted.isZero(),
      amount,
      amountPretty,
      amountUnformatted,
      decimals,
      name,
      symbol,
      totalSupply,
      totalSupplyPretty,
      totalSupplyUnformatted
    },
    pricePerShare,
    underlyingAmount: {
      amount: underlyingAmount,
      amountPretty: underlyingAmountPretty,
      amountUnformatted: underlyingAmountUnformatted
    },
    podUnderlyingTokenBalance: underlyingTokenBalance,
    podUnderlyingTicketBalance: underlyingTicketBalance
  }
}
