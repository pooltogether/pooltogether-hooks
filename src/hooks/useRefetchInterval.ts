import { NETWORK, sToMs } from '@pooltogether/utilities'

const useRefetchInterval = (chainId?: number) => {
  if (process.env.NEXT_JS_DOMAIN_NAME) {
    switch (chainId) {
      case NETWORK.mainnet:
        return sToMs(22)
      case NETWORK.mumbai:
      case NETWORK.matic:
        return sToMs(10)
      default:
        return sToMs(22)
    }
  }

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
