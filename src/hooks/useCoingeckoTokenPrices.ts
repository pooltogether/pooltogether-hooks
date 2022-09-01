import { useQueries, useQuery } from 'react-query'
import { getAddress, isAddress } from '@ethersproject/address'
import { NETWORK } from '@pooltogether/utilities'

import { NO_REFETCH, COINGECKO_API_URL, COINGECKO_ASSET_PLATFORMS, QUERY_KEYS } from '../constants'
import { TokenPrice } from '../types/token'
import { useMemo } from 'react'

/**
 * Fetch token prices across multiple chains with a single hook
 * @param contractAddresses
 * @returns
 */
export const useCoingeckoTokenPricesAcrossChains = (contractAddresses: {
  [chainId: number]: string[]
}) => {
  const chainIds = contractAddresses ? Object.keys(contractAddresses).map(Number) : []

  const queriesResult = useQueries(
    chainIds.map((chainId) => {
      const validNetworks = Object.keys(COINGECKO_ASSET_PLATFORMS)
      const isValidNetwork = validNetworks.includes(chainId.toString())
      const isValidAddresses = contractAddresses[chainId].reduce(
        (isValid, contractAddress) => isValid && isAddress(contractAddress),
        true
      )
      const assetPlatform = COINGECKO_ASSET_PLATFORMS[chainId]

      const enabled =
        Boolean(contractAddresses[chainId]) &&
        Boolean(isValidAddresses) &&
        isValidNetwork &&
        Boolean(chainId) &&
        Boolean(assetPlatform)

      return {
        ...NO_REFETCH,
        staleTime: Infinity,
        queryKey: [QUERY_KEYS.getCoingeckoTokenPrices, contractAddresses[chainId], chainId],
        queryFn: async () => getCoingeckoTokenPrices(chainId, contractAddresses[chainId]),
        enabled
      }
    })
  )

  return useMemo(() => {
    const isFetched = queriesResult?.every((queryResult) => queryResult.isFetched)
    const refetch = async () => queriesResult?.forEach((queryResult) => queryResult.refetch())

    return {
      isFetched,
      refetch,
      data:
        queriesResult?.reduce((data, queryResult) => {
          if (queryResult.isFetched && !!queryResult.data && typeof queryResult.data === 'object') {
            return { ...data, ...queryResult.data }
          } else {
            return data
          }
        }, {} as { [address: string]: TokenPrice }) || ({} as { [address: string]: TokenPrice })
    }
  }, [queriesResult])
}

export const useCoingeckoTokenPrices = (chainId: number, contractAddresses: string[]) => {
  const validNetworks = Object.keys(COINGECKO_ASSET_PLATFORMS)

  const isValidNetwork = validNetworks.includes(chainId.toString())
  const isValidAddresses = contractAddresses?.reduce(
    (isValid, contractAddress) => isValid && isAddress(contractAddress),
    true
  )

  const assetPlatform = COINGECKO_ASSET_PLATFORMS[chainId]

  const enabled =
    Boolean(contractAddresses) &&
    Boolean(isValidAddresses) &&
    isValidNetwork &&
    Boolean(chainId) &&
    Boolean(assetPlatform)

  return useQuery(
    [QUERY_KEYS.getCoingeckoTokenPrices, contractAddresses, chainId],
    async () => await getCoingeckoTokenPrices(chainId, contractAddresses),
    {
      staleTime: Infinity,
      enabled,
      ...NO_REFETCH
    }
  )
}

/**
 * @param chainId
 * @param contractAddresses
 * @returns
 */
export const getCoingeckoTokenPrices = async (
  chainId: number,
  contractAddresses: string[]
): Promise<{
  [address: string]: TokenPrice
}> => {
  const assetPlatform = COINGECKO_ASSET_PLATFORMS[chainId]

  // Hardcode some prices for Goerli & Mumbai testing
  if (
    assetPlatform === COINGECKO_ASSET_PLATFORMS[NETWORK.goerli] ||
    assetPlatform === COINGECKO_ASSET_PLATFORMS[NETWORK.mumbai]
  ) {
    return contractAddresses.reduce((tokenPrices, contractAddress) => {
      tokenPrices[getAddress(contractAddress)] = { usd: 1 }
      tokenPrices[contractAddress.toLowerCase()] = { usd: 1 }
      return tokenPrices
    }, {} as { [address: string]: TokenPrice })
  }

  try {
    const url = new URL(`${COINGECKO_API_URL}/simple/token_price/${assetPlatform}`)
    url.searchParams.set('contract_addresses', contractAddresses.join(','))
    url.searchParams.set('vs_currencies', 'usd')
    const response = await fetch(url.toString())
    const tokenPrices = await response.json()
    const tokenPricesFormatted: {
      [address: string]: TokenPrice
    } = {}
    Object.keys(tokenPrices).forEach((tokenAddress) => {
      const tokenPrice =
        tokenPrices[getAddress(tokenAddress)] || tokenPrices[tokenAddress.toLowerCase()]
      tokenPricesFormatted[getAddress(tokenAddress)] = tokenPrice
      tokenPricesFormatted[tokenAddress.toLowerCase()] = tokenPrice
    })
    return tokenPricesFormatted
  } catch (e) {
    console.error(e.message)
    return {}
  }
}
