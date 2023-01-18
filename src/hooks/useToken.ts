import { formatUnits } from '@ethersproject/units'
import { batch, contract } from '@pooltogether/etherplex'
import { numberWithCommas } from '@pooltogether/utilities'
import { useReadProvider } from '@pooltogether/wallet-connection'
import { getAddress } from 'ethers/lib/utils'
import { useQuery, useQueryClient } from 'react-query'

import { ERC20Abi } from '../abis/ERC20Abi'
import { NO_REFETCH, QUERY_KEYS } from '../constants'
import { TokenBalances } from '../types/token'
import { populatePerIdCache } from '../utils/populatePerIdCache'

/**
 * Returns a dictionary keyed by the token addresses filled
 * @param chainId
 * @param tokenAddresses
 * @returns
 */
export const useTokens = (chainId: number, tokenAddresses: string[]) => {
  const readProvider = useReadProvider(chainId)
  const queryClient = useQueryClient()

  const enabled =
    tokenAddresses.reduce((aggregate, current) => aggregate && Boolean(current), true) &&
    Array.isArray(tokenAddresses) &&
    tokenAddresses.length > 0 &&
    Boolean(chainId)

  const getCacheKey = (id: (string | number)[]) => [QUERY_KEYS.tokens, chainId, id]

  return useQuery(
    getCacheKey(tokenAddresses),
    async () => await getTokens(readProvider, tokenAddresses),
    {
      enabled,
      // refetchInterval,
      ...NO_REFETCH,
      onSuccess: (data) => populatePerIdCache(queryClient, getCacheKey, data)
    }
  )
}

/**
 * Returns the provided token
 * @param chainId
 * @param tokenAddress
 * @returns
 */
export const useToken = (chainId: number, tokenAddress: string) => {
  const { data: tokenBalances, ...queryData } = useTokens(chainId, [tokenAddress])
  return { ...queryData, data: tokenBalances ? tokenBalances[tokenAddress] : null }
}

export const getTokens = async (readProvider, tokenAddresses): Promise<TokenBalances> => {
  const batchCalls = []
  tokenAddresses.map((tokenAddress) => {
    const tokenContract = contract(tokenAddress, ERC20Abi, tokenAddress)
    batchCalls.push(
      tokenContract
        .decimals()
        .name()
        .symbol()
        .totalSupply()
    )
  })
  const response = await batch(readProvider, ...batchCalls)
  const result = {}
  Object.keys(response).map((tokenAddress) => {
    const decimals = response[tokenAddress].decimals[0]
    const name = response[tokenAddress].name[0]
    const symbol = response[tokenAddress].symbol[0]
    const totalSupplyUnformatted = response[tokenAddress].totalSupply[0]
    const totalSupply = formatUnits(totalSupplyUnformatted, decimals)
    const totalSupplyPretty = numberWithCommas(totalSupply)

    result[tokenAddress.toLowerCase()] = {
      address: tokenAddress.toLowerCase(),
      decimals,
      name,
      symbol,
      totalSupply,
      totalSupplyPretty,
      totalSupplyUnformatted
    }

    result[getAddress(tokenAddress)] = {
      address: getAddress(tokenAddress),
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
