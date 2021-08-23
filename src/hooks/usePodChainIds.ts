import { NETWORK } from '@pooltogether/utilities'
import { useAppEnv, APP_ENVIRONMENT } from './useAppEnv'

/**
 *
 * @returns an array of supported chain ids for the current environment
 */
export const usePodChainIds = () => {
  const { appEnv } = useAppEnv()
  if (appEnv === APP_ENVIRONMENT.testnets) {
    return [NETWORK.rinkeby]
  }
  return [NETWORK.mainnet]
}
