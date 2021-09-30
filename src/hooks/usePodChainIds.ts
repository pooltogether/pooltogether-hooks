import { NETWORK } from '@pooltogether/utilities'
import { useIsTestnets } from './useIsTestnets'

/**
 *
 * @returns an array of supported chain ids for the current environment
 */
export const usePodChainIds = () => {
  const { isTestnets } = useIsTestnets()
  return isTestnets ? [NETWORK.rinkeby] : [NETWORK.mainnet]
}
