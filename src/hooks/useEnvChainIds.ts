import { NETWORK } from '@pooltogether/utilities'

import { useIsTestnets, APP_ENVIRONMENTS } from './useIsTestnets'

export const CHAIN_IDS_BY_APP_ENV = Object.freeze({
  [APP_ENVIRONMENTS.mainnets]: [NETWORK.mainnet, NETWORK.polygon, NETWORK.bsc, NETWORK.celo],
  [APP_ENVIRONMENTS.testnets]: [NETWORK.goerli]
})

/**
 * Returns the list of chainIds relevant for the current app state
 * @returns
 */
export const useEnvChainIds = () => {
  const { isTestnets } = useIsTestnets()
  const appEnv = isTestnets ? APP_ENVIRONMENTS.testnets : APP_ENVIRONMENTS.mainnets
  return CHAIN_IDS_BY_APP_ENV[appEnv]
}
