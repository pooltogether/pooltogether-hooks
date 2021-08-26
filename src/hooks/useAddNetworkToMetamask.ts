import { getChain, formatNetworkForAddEthereumChain } from '@pooltogether/evm-chains-extended'

export const useAddNetworkToMetamask = (chainId) => {
  return async () => {
    const ethereum = (window as any).ethereum

    const network = getChain(chainId)
    const formattedNetwork = formatNetworkForAddEthereumChain(network)

    const basicFormattedNetwork = { chainId: formattedNetwork.chainId }

    try {
      await ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [basicFormattedNetwork]
      })
    } catch (error) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (error.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [formattedNetwork]
          })
        } catch (addError) {
          console.error('error trying to add chain')
        }
      }
      // handle other "switch" errors
    }
  }
}
