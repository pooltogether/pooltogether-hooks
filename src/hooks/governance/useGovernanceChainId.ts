import { NETWORK } from '@pooltogether/utilities'
import { useIsTestnets } from '../app/useIsTestnets'

export const useGovernanceChainId = () => {
  const { isTestnets } = useIsTestnets()
  return isTestnets ? NETWORK.goerli : NETWORK.mainnet
}
