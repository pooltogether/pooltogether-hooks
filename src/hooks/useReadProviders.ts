import { useMemo } from 'react'
import { Provider } from '@ethersproject/abstract-provider'
import { getReadProvider } from '@pooltogether/utilities'

/**
 *
 * @param {*} chainIds a list of chainIds to get providers for
 * @returns Providers for the provided chain ids
 */
export const useReadProviders = (chainIds: number[]): { [chainId: number]: Provider } => {
  return useMemo(() => {
    const providers: { [chainId: number]: Provider } = {}
    chainIds.forEach((chainId) => {
      providers[chainId] = getReadProvider(chainId)
    })
    return providers
  }, [...chainIds])
}
