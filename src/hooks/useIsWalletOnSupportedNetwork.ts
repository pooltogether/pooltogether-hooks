import useOnboard from './useOnboard'

const useIsWalletOnSupportedNetwork = (supportedNetworks) => {
  const { network } = useOnboard()
  if (!network) return false
  return supportedNetworks.includes(network)
}

export default useIsWalletOnSupportedNetwork
