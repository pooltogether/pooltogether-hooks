import { batch, contract } from '@pooltogether/etherplex'
import { formatUnits } from '@ethersproject/units'
import { useQuery, useQueryClient } from 'react-query'
import { numberWithCommas } from '@pooltogether/utilities'

import { NO_REFETCH, QUERY_KEYS } from '../constants'
import { ERC20Abi } from '../abis/ERC20Abi'
import { useReadProvider } from './useReadProvider'
import { populatePerIdCache } from '../utils/populatePerIdCache'
import { TokenBalances } from '../types/token'
import { getAddress } from 'ethers/lib/utils'

/**
 * Returns a dictionary keyed by the token addresses filled with
 * the provided addresses balances of the provided tokens
 * @param chainId
 * @param address
 * @param tokenAddresses
 * @returns
 */
export const useTokenBalances = (
  chainId: number,
  address: string,
  tokenAddresses: string[],
  refetchInterval?: number
) => {
  const readProvider = useReadProvider(chainId)
  const queryClient = useQueryClient()

  const enabled =
    Boolean(address) &&
    tokenAddresses.reduce((aggregate, current) => aggregate && Boolean(current), true) &&
    Array.isArray(tokenAddresses) &&
    tokenAddresses.length > 0 &&
    Boolean(chainId)

  const getCacheKey = (id: (string | number)[]) => [QUERY_KEYS.tokenBalances, chainId, address, id]

  return useQuery(
    getCacheKey(tokenAddresses),
    async () => await getTokenBalances(readProvider, address, tokenAddresses),
    {
      enabled,
      refetchInterval,
      ...NO_REFETCH,
      onSuccess: (data) => populatePerIdCache(queryClient, getCacheKey, data)
    }
  )
}

/**
 * Returns the provided addresses balance of the provided token
 * @param chainId
 * @param usersAddress
 * @param tokenAddress
 * @returns
 */
export const useTokenBalance = (
  chainId: number,
  address: string,
  tokenAddress: string,
  refetchInterval?: number
) => {
  const { data: tokenBalances, ...queryData } = useTokenBalances(
    chainId,
    address,
    [tokenAddress],
    refetchInterval
  )
  return { ...queryData, data: tokenBalances ? tokenBalances[tokenAddress] : null }
}

export const getTokenBalances = async (
  readProvider,
  address,
  tokenAddresses
): Promise<TokenBalances> => {
  const batchCalls = []
  tokenAddresses.map((tokenAddress) => {
    const tokenContract = contract(tokenAddress, ERC20Abi, tokenAddress)
    batchCalls.push(
      tokenContract
        .balanceOf(address)
        .decimals()
        .name()
        .symbol()
        .totalSupply()
    )
  })
  const response = await batch(readProvider, ...batchCalls)
  const result = {}
  Object.keys(response).map((tokenAddress) => {
    const amountUnformatted = response[tokenAddress].balanceOf[0]
    const decimals = response[tokenAddress].decimals[0]
    const amount = formatUnits(amountUnformatted, decimals)
    const amountPretty = numberWithCommas(amount)
    const name = response[tokenAddress].name[0]
    const symbol = response[tokenAddress].symbol[0]
    const totalSupplyUnformatted = response[tokenAddress].totalSupply[0]
    const totalSupply = formatUnits(totalSupplyUnformatted, decimals)
    const totalSupplyPretty = numberWithCommas(totalSupply)

    result[tokenAddress] = {
      address: tokenAddress,
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
    }
  })
  return result
}
