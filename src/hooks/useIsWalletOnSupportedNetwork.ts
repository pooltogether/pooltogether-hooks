export const useIsWalletOnSupportedNetwork = (network, supportedNetworks) => {
  if (!network) return false
  return supportedNetworks.includes(network)
}
