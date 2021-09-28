export const useIsWalletOnSupportedNetwork = (network, supportedNetworks) => {
  if (!network || !supportedNetworks) return false
  return supportedNetworks.includes(network)
}
