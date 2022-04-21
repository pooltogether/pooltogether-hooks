import { NETWORK, sToMs } from '@pooltogether/utilities'

const REFETCH_INTERVALS = Object.freeze({
  [NETWORK.mainnet]: sToMs(16),
  [NETWORK.polygon]: sToMs(5),
  [NETWORK.mumbai]: sToMs(5),
  [NETWORK.avalanche]: sToMs(5),
  [NETWORK.fuji]: sToMs(5)
})

export const useRefetchInterval = (chainId: number = NETWORK.mainnet) => {
  return getRefetchInterval(chainId)
}

export const getRefetchInterval = (chainId: number = NETWORK.mainnet) =>
  REFETCH_INTERVALS[chainId] || REFETCH_INTERVALS[NETWORK.mainnet]
