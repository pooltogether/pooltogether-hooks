import { useQuery } from 'react-query'

import { isValidAddress, NETWORK } from '@pooltogether/utilities'
import { COINGECKO_API_URL, COINGECKO_ASSET_PLATFORMS, QUERY_KEYS } from '../constants'
import { TokenPrices } from '../types/token'

export const useCoingeckoTokenPrices = (chainId: number, contractAddresses: string[]) => {
  const validNetworks = Object.keys(COINGECKO_ASSET_PLATFORMS)

  const isValidNetwork = validNetworks.includes(chainId.toString())
  const isValidAddresses = contractAddresses?.reduce(
    (isValid, contractAddress) => isValid && isValidAddress(contractAddress),
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
    async () => await getCoingeckoTokenPrices(assetPlatform, contractAddresses),
    {
      staleTime: Infinity,
      enabled,
      refetchInterval: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false
    }
  )
}

const getCoingeckoTokenPrices = async (assetPlatform: string, contractAddresses: string[]) => {
  // Hardcode some prices for Rinkeby testing
  if (assetPlatform === COINGECKO_ASSET_PLATFORMS[NETWORK.rinkeby]) {
    return contractAddresses.reduce((tokenPrices, contractAddress) => {
      tokenPrices[contractAddress] = { usd: 1 }
      return tokenPrices
    }, {} as TokenPrices)
  }

  try {
    const url = new URL(`${COINGECKO_API_URL}/simple/token_price/${assetPlatform}`)
    url.searchParams.set('contract_addresses', contractAddresses.join(','))
    url.searchParams.set('vs_currencies', 'usd')
    const response = await fetch(url.toString())
    const tokenPrices: TokenPrices = await response.json()
    return tokenPrices
  } catch (e) {
    console.error(e.message)
    return undefined
  }
}

export const useCoingeckoSimplePrices = () => {
  return useQuery(
    [QUERY_KEYS.getCoingeckoTokenPrices],
    async () => await getCoingeckoSimplePrices(),
    {
      staleTime: Infinity,
      enabled: true,
      refetchInterval: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false
    }
  )
}

const getCoingeckoSimplePrices = async () => {
  try {
    const url = new URL(`${COINGECKO_API_URL}/simple/price`)
    url.searchParams.set('ids', ['ethereum', 'matic-network'].join(','))
    url.searchParams.set('vs_currencies', 'usd')
    const response = await fetch(url.toString())
    const tokenPrices = await response.json()
    return tokenPrices
  } catch (e) {
    console.error(e.message)
    return undefined
  }
}
