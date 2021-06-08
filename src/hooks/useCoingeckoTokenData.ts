import { useQuery } from 'react-query'

import { isValidAddress, NETWORK } from '@pooltogether/utilities'
import { QUERY_KEYS } from '../constants'

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'

const COINGECKO_ASSET_PLATFORMS = Object.freeze({
  [NETWORK.mainnet]: 'ethereum',
  [NETWORK.bsc]: 'binance-smart-chain',
  [NETWORK.polygon]: 'polygon-pos'
})

const useCoingeckoTokenData = (chainId, contractAddress) => {
  const validNetworks = Object.keys(COINGECKO_ASSET_PLATFORMS)

  const isValidNetwork = validNetworks.includes(chainId.toString())
  const _isValidAddress = isValidAddress(contractAddress)

  const assetPlatform = COINGECKO_ASSET_PLATFORMS[chainId]

  return useQuery(
    [QUERY_KEYS.getCoingeckoTokenData, contractAddress, chainId],
    async () => await getCoingeckoTokenData(assetPlatform, contractAddress),
    {
      staleTime: Infinity,
      enabled: Boolean(contractAddress) && _isValidAddress && isValidNetwork,
      refetchInterval: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false
    }
  )
}

export default useCoingeckoTokenData

const getCoingeckoTokenData = async (assetPlatform, contractAddress) => {
  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/coins/${assetPlatform}/contract/${contractAddress}`
    )
    const result = await response.json()
    console.log('response', result)
    return result
  } catch (e) {
    console.warn(e.message)
    return undefined
  }
}
