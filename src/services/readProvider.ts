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
import { Provider } from '@ethersproject/abstract-provider'
import { RpcApiKeys } from '../hooks/useInitRpcApiKeys'

const POLYGON_INFURA_WEBSOCKETS_URL = `wss://polygon-mainnet.infura.io/ws/v3`
const BINANCE_QUICKNODE_WEBSOCKETS_URL = `wss://red-fragrant-fire.bsc.quiknode.pro`

const RPC_URLS = Object.freeze({
  [NETWORK.polygon]: 'https://polygon-rpc.com/',
  [NETWORK.bsc]: 'https://bsc-dataseed.binance.org/'
})

const providerCache: { [networkName: string]: Provider } = {}

export const readProvider = (chainId: number, rpcApiKeys: RpcApiKeys) => {
  let provider: Provider

  try {
    if (chainId) {
      let networkData = getChain(chainId)
      const jsonRpcProviderUrl = networkData?.rpc?.[0]

      const cachedProvider = providerCache[networkData?.name]
      if (Boolean(cachedProvider)) {
        return cachedProvider
      }

      if (!networkData) {
        networkData = getChain(NETWORK.mainnet)
        provider = ethers.getDefaultProvider()
      } else if (chainId === NETWORK.mainnet) {
        if (rpcApiKeys.infura.mainnet) {
          provider = new ethers.providers.InfuraProvider(NETWORK.mainnet, rpcApiKeys.infura.mainnet)
        } else {
          provider = ethers.getDefaultProvider(networkData.network)
        }
      } else if (chainId === NETWORK.bsc) {
        if (rpcApiKeys.quicknode.bsc) {
          provider = new ethers.providers.WebSocketProvider(
            `${BINANCE_QUICKNODE_WEBSOCKETS_URL}/${rpcApiKeys.quicknode.bsc}/`
          )
        } else {
          provider = new ethers.providers.JsonRpcProvider(RPC_URLS[NETWORK.bsc], NETWORK.bsc)
        }
      } else if (chainId === NETWORK.polygon) {
        if (rpcApiKeys.infura.polygon) {
          provider = new ethers.providers.WebSocketProvider(
            `${POLYGON_INFURA_WEBSOCKETS_URL}/${rpcApiKeys.infura.polygon}`
          )
        } else {
          provider = new ethers.providers.JsonRpcProvider(
            RPC_URLS[NETWORK.polygon],
            NETWORK.polygon
          )
        }
      } else if (chainId === NETWORK.mumbai) {
        provider = new ethers.providers.JsonRpcProvider(
          'https://rpc-mumbai.maticvigil.com/',
          NETWORK.mumbai
        )
      } else if (chainId === 1234 || chainId === 31337) {
        provider = new ethers.providers.JsonRpcProvider()
      } else if (Boolean(jsonRpcProviderUrl)) {
        provider = new ethers.providers.JsonRpcProvider(jsonRpcProviderUrl)
      }

      // Store provider in cache
      providerCache[networkData.name] = provider
    }
  } catch (e) {
    console.error(e)
  }

  return provider
}
