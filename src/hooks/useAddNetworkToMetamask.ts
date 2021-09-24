import { getChain, formatNetworkForAddEthereumChain } from '@pooltogether/evm-chains-extended'

interface AddNetworkCallbacks {
  onSuccess?: () => void
  onError?: () => void
}

export const useAddNetworkToMetamask = (chainId: number, callbacks?: AddNetworkCallbacks) => {
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
      callbacks?.onSuccess?.()
    } catch (error) {
      // This error code indicates that the chain has not been added to MetaMask.
      if (error.code === 4902) {
        try {
          await ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [formattedNetwork]
          })
          callbacks?.onSuccess?.()
        } catch (addError) {
          callbacks?.onError?.()
          console.error(`Error trying to add chain id ${chainId}`)
        }
      }
      // handle other "switch" errors
    }
  }
}
