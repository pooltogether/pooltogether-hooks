import { batch, contract } from '@pooltogether/etherplex'
import { formatUnits } from '@ethersproject/units'
import { useQuery, useQueryClient, UseQueryResult } from 'react-query'
import { numberWithCommas } from '@pooltogether/utilities'
import { NO_REFETCH, QUERY_KEYS } from '../../constants'
import { ERC20Abi } from '../../abis/ERC20Abi'
import { populatePerIdCache } from '../../utils/populatePerIdCache'
import { BigNumber } from 'ethers'
import { BaseProvider } from '@ethersproject/providers'
import { useReadProvider } from '@pooltogether/wallet-connection'

/**
 * Returns a dictionary keyed by the token addresses filled with token data.
 * Stores token data in the cache.
 * @param chainId
 * @param tokenAddresses
 * @returns
 */
export const useTokens = (chainId: number, tokenAddresses: string[]) => {
  const queryClient = useQueryClient()
  const readProvider = useReadProvider(chainId)

  const enabled =
    tokenAddresses.every((tokenAddress) => !!tokenAddress && typeof tokenAddress === 'string') &&
    Array.isArray(tokenAddresses) &&
    tokenAddresses.length > 0 &&
    Boolean(chainId) &&
    !!readProvider

  const getCacheKey = (id: (string | number)[]) => [QUERY_KEYS.tokens, chainId, id]

  return useQuery(
    getCacheKey(tokenAddresses),
    async () => await getTokens(chainId, tokenAddresses, readProvider),
    {
      enabled,
      ...NO_REFETCH,
      onSuccess: (data) => populatePerIdCache(queryClient, getCacheKey, data)
    }
  )
}

/**
 * Returns the requested token data.
 * @param chainId
 * @param tokenAddress
 * @returns
 */
export const useToken = (
  chainId: number,
  tokenAddress: string
): {
  data: {
    address: string
    decimals: string
    name: string
    symbol: string
    totalSupply: string
    totalSupplyPretty: string
    totalSupplyUnformatted: BigNumber
  }
} & Omit<
  UseQueryResult<{
    [tokenAddress: string]: {
      address: string
      decimals: string
      name: string
      symbol: string
      totalSupply: string
      totalSupplyPretty: string
      totalSupplyUnformatted: BigNumber
    }
  }>,
  'data'
> => {
  const result = useTokens(chainId, [tokenAddress])
  return { ...result, data: result.data?.[tokenAddress] }
}

export const getTokens = async (
  chainId: number,
  tokenAddresses: string[],
  provider: BaseProvider
) => {
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
  const response = await batch(provider, ...batchCalls)
  const result: {
    [tokenAddress: string]: {
      address: string
      decimals: string
      name: string
      symbol: string
      totalSupply: string
      totalSupplyPretty: string
      totalSupplyUnformatted: BigNumber
    }
  } = {}
  Object.keys(response).map((tokenAddress) => {
    const decimals = response[tokenAddress].decimals[0]
    const name = response[tokenAddress].name[0]
    const symbol = response[tokenAddress].symbol[0]
    const totalSupplyUnformatted = response[tokenAddress].totalSupply[0]
    const totalSupply = formatUnits(totalSupplyUnformatted, decimals)
    const totalSupplyPretty = numberWithCommas(totalSupply)

    result[tokenAddress] = {
      address: tokenAddress,
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
