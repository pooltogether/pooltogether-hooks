import { batch, contract } from '@pooltogether/etherplex'
import { useQuery, useQueryClient } from 'react-query'

import { NO_REFETCH, QUERY_KEYS } from '../constants'
import { ERC20Abi } from '../abis/ERC20Abi'
import { useReadProvider } from './useReadProvider'
import { populatePerIdCache } from '../utils/populatePerIdCache'
import { Token } from '../types/token'
import { getAddress } from 'ethers/lib/utils'

/**
 * Returns a dictionary keyed by the token addresses filled with
 * details about the provided tokens
 * @param chainId
 * @param tokenAddresses[]
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

  const getCacheKey = (id: (string | number)[]) => [QUERY_KEYS.tokenBalances, chainId, id]

  return useQuery(
    getCacheKey(tokenAddresses),
    async () => await getTokens(readProvider, tokenAddresses),
    {
      enabled,
      ...NO_REFETCH,
      onSuccess: (data) => populatePerIdCache(queryClient, getCacheKey, data)
    }
  )
}

/**
 * Returns the details of the provided token address
 * @param chainId
 * @param tokenAddress
 * @returns
 */
export const useToken = (chainId: number, tokenAddress: string) => {
  const { data: token, ...queryData } = useTokens(chainId, [tokenAddress])
  return { ...queryData, data: token ? token : null }
}

export const getTokens = async (readProvider, tokenAddresses): Promise<object> => {
  const batchCalls = []
  tokenAddresses.map((tokenAddress) => {
    const tokenContract = contract(tokenAddress, ERC20Abi, tokenAddress)
    batchCalls.push(tokenContract.decimals().name().symbol())
  })

  const response = await batch(readProvider, ...batchCalls)
  const result = {}
  Object.keys(response).map((tokenAddress) => {
    const decimals = response[tokenAddress].decimals[0]
    const name = response[tokenAddress].name[0]
    const symbol = response[tokenAddress].symbol[0]

    result[tokenAddress.toLowerCase()] = {
      address: tokenAddress.toLowerCase(),
      decimals,
      name,
      symbol
    }

    result[getAddress(tokenAddress)] = {
      address: getAddress(tokenAddress),
      decimals,
      name,
      symbol
    }
  })

  return result
}
