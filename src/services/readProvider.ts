/**
  Retrieves a new provider specific to read.  The reason we separate the read and the writes is that the
  web3 providers on mobile dapps are extremely buggy; it's better to read the network through an INFURA
  JsonRpc endpoint.

  This function will first check to see if there is an injected web3.  If web3 is being injected, then a
  Ethers Web3Provider is instantiated to check the network.  Once the network is determined the Ethers
  getDefaultProvider function is used to create a provider pointing to the same network using an Infura node.
*/
import { ethers } from 'ethers'
import { getChain } from '@pooltogether/evm-chains-extended'
import { NETWORK, ETHEREUM_NETWORKS } from '@pooltogether/utilities'

const POLYGON_INFURA_WEBSOCKETS_URL = `wss://polygon-mainnet.infura.io/ws/v3/${process.env.NEXT_JS_INFURA_ID}`
const providerCache = {}

export const readProvider = async (chainId) => {
  let provider: ethers.providers.BaseProvider

  try {
    if (chainId) {
      let network = getChain(chainId)
      const jsonRpcProviderUrl = network?.rpc?.[0]

      if (!network || (network && ETHEREUM_NETWORKS.includes(chainId))) {
        network = getChain(NETWORK.mainnet)
        provider = ethers.getDefaultProvider(network.network)
      } else if (chainId === 137) {
        provider = new ethers.providers.WebSocketProvider(POLYGON_INFURA_WEBSOCKETS_URL)
      } else if (chainId === 1234 || chainId === 31337) {
        provider = new ethers.providers.JsonRpcProvider()
      } else if (Boolean(jsonRpcProviderUrl)) {
        provider = new ethers.providers.JsonRpcProvider(jsonRpcProviderUrl)
      }

      const net = await provider.getNetwork()

      // If we're running against an Ethereum network
      if (net && net.name !== 'unknown') {
        if (!providerCache[net.name]) {
          providerCache[net.name] = ethers.providers.InfuraProvider.getWebSocketProvider(
            net.name,
            process.env.NEXT_JS_INFURA_ID
          )
        }

        // use a separate Infura-based provider for consistent read api
        provider = providerCache[net.name]
      }
    }
  } catch (e) {
    console.error(e)
  }

  return provider
}
