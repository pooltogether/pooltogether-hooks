import { Provider } from '@ethersproject/abstract-provider'

import { RpcApiKeys } from '../hooks/useInitRpcApiKeys'
import { readProvider } from '../services/readProvider'
import { useRpcApiKeys } from './useInitRpcApiKeys'

/**
 *
 * @param {*} chainIds a list of chainIds to get providers for
 * @returns Providers for the provided chain ids
 */
export const useReadProviders = (chainIds) => {
  const rpcApiKeys = useRpcApiKeys()
  return getReadProviders(chainIds, rpcApiKeys)
}

const getReadProviders = (chainIds: number[], rpcApiKeys: RpcApiKeys) => {
  const readProviders: { [chainId: number]: Provider } = {}
  for (const chainId of chainIds) {
    readProviders[chainId] = readProvider(chainId, rpcApiKeys)
  }
  return readProviders
}
