import { APP_ENVIRONMENTS, getStoredIsTestnetsCookie } from '../hooks/useIsTestnets'

export const getAppEnvString = () => {
  const isTestnets = getStoredIsTestnetsCookie()
  return isTestnets ? APP_ENVIRONMENTS.testnets : APP_ENVIRONMENTS.mainnets
}
