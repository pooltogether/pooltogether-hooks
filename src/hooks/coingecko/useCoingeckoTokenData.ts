import { useQuery } from 'react-query'
import { isAddress } from '@ethersproject/address'
import { NETWORK } from '@pooltogether/utilities'

const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'
const COINGECKO_ASSET_PLATFORMS = Object.freeze({
  [NETWORK.mainnet]: 'ethereum',
  [NETWORK.bsc]: 'binance-smart-chain',
  [NETWORK.polygon]: 'polygon-pos',
  [NETWORK.celo]: 'celo',
  [NETWORK.goerli]: 'goerli',
  [NETWORK.mumbai]: 'mumbai',
  [NETWORK.avalanche]: 'avalanche',
  [NETWORK.optimism]: 'optimistic-ethereum',
  [NETWORK['optimism-goerli']]: 'optimistic-ethereum'
})

export const useCoingeckoTokenData = (chainId: number, contractAddress: string) => {
  const validNetworks = Object.keys(COINGECKO_ASSET_PLATFORMS)

  const isValidNetwork = validNetworks.includes(chainId.toString()) && chainId !== NETWORK.goerli
  const isValidAddress = isAddress(contractAddress)

  const assetPlatform = COINGECKO_ASSET_PLATFORMS[chainId]

  const enabled = Boolean(contractAddress) && isValidAddress && isValidNetwork && Boolean(chainId)

  return useQuery(
    ['useCoingeckoTokenData', contractAddress, chainId],
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

const getCoingeckoTokenData = async (assetPlatform: string, contractAddress: string) => {
  try {
    const response = await fetch(
      `${COINGECKO_API_URL}/coins/${assetPlatform}/contract/${contractAddress}`
    )
    console.log({ response })
    return await response.json()
  } catch (e) {
    console.warn(e.message)
    return undefined
  }
}
