import { useOnboard } from './useOnboard'

export const useIsWalletOnSupportedNetwork = (supportedNetworks) => {
  const { network } = useOnboard()
  if (!network) return false
  return supportedNetworks.includes(network)
}
