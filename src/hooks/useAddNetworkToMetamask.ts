import { getChain, formatNetworkForAddEthereumChain } from '@pooltogether/evm-chains-extended'

const useAddNetworkToMetamask = (chainId) => {
  return async () => {
    try {
      const ethereum = (window as any).ethereum

      const network = getChain(chainId)
      const formattedNetwork = formatNetworkForAddEthereumChain(network)

      await ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [formattedNetwork]
      })
    } catch (error) {
      console.error(error)
    }
  }
}

export default useAddNetworkToMetamask
