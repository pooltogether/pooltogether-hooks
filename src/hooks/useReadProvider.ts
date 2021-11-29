import { useMemo } from 'react'
import { getReadProvider } from '@pooltogether/utilities'
import { Provider } from '@ethersproject/abstract-provider'

/**
 *
 * @param {*} chainId a chainId to get a provider for
 * @returns Provider for the provided chain id
 */
export const useReadProvider = (chainId: number): Provider => {
  return useMemo(() => {
    return getReadProvider(chainId)
  }, [chainId])
}
