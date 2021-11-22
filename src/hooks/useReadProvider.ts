import { readProvider } from '../services/readProvider'
import { useRpcApiKeys } from './useInitRpcApiKeys'

/**
 *
 * @param {*} chainId a chainId to get a provider for
 * @returns Provider for the provided chain id
 */
export const useReadProvider = (chainId: number) => {
  const rpcApiKeys = useRpcApiKeys()
  return readProvider(chainId, rpcApiKeys)
}
