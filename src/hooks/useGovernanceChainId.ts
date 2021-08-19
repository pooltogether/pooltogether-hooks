import { NETWORK } from '@pooltogether/utilities'
import { useAppEnv, APP_ENVIRONMENT } from './useAppEnv'

export const useGovernanceChainId = () => {
  const { appEnv } = useAppEnv()
  return appEnv === APP_ENVIRONMENT.mainnets ? NETWORK.mainnet : NETWORK.rinkeby
}
