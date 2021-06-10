import { NETWORK, sToMs } from '@pooltogether/utilities'

const useRefetchInterval = (chainId?: number) => {
  switch (chainId) {
    case NETWORK.mainnet:
      return sToMs(16)
    case NETWORK.mumbai:
    case NETWORK.matic:
      return sToMs(5)
    default:
      return sToMs(16)
  }
}

export default useRefetchInterval
