import { useQuery } from 'react-query'
import { isAddress } from '@ethersproject/address'
import { NETWORK } from '@pooltogether/utilities'

import { COINGECKO_API_URL, COINGECKO_ASSET_PLATFORMS, QUERY_KEYS } from '../constants'

export const useCoingeckoTokenData = (chainId, contractAddress) => {
  const validNetworks = Object.keys(COINGECKO_ASSET_PLATFORMS)

  const isValidNetwork = validNetworks.includes(chainId.toString()) && chainId !== NETWORK.goerli
  const isValidAddress = isAddress(contractAddress)

  const assetPlatform = COINGECKO_ASSET_PLATFORMS[chainId]

  const enabled = Boolean(contractAddress) && isValidAddress && isValidNetwork && Boolean(chainId)

  return useQuery(
    [QUERY_KEYS.getCoingeckoTokenData, contractAddress, chainId],
    async () => await getCoingeckoTokenData(assetPlatform, contractAddress),
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

const getCoingeckoTokenData = async (assetPlatform, contractAddress) => {
  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/coins/${assetPlatform}/contract/${contractAddress}`
    )
    return await response.json()
  } catch (e) {
    console.warn(e.message)
    return undefined
  }
}
