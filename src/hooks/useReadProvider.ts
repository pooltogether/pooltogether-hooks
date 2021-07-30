import { ethers } from 'ethers'
import { useQuery } from 'react-query'

import { NO_REFETCH_QUERY_OPTIONS, QUERY_KEYS } from '../constants'
import { readProvider } from '../services/readProvider'
import { useInfuraId } from './useInitInfuraId'
import { useQuickNodeId } from './useInitQuickNodeId'

/**
 *
 * @param {*} chainId a chainId to get a provider for
 * @returns Providers for the provided chain id
 */
const useReadProvider = (chainId) => {
  const infuraId = useInfuraId()
  const quickNodeId = useQuickNodeId()
  const {
    data: _readProvider,
    isFetched,
    isFetching
  } = useQuery<ethers.providers.BaseProvider, Error>(
    [QUERY_KEYS.readProvider, chainId, quickNodeId],
    () => readProvider(chainId, infuraId, quickNodeId),
    {
      ...NO_REFETCH_QUERY_OPTIONS,
      enabled: Boolean(infuraId) && Boolean(chainId) && Boolean(quickNodeId)
    }
  )
  const isReadProviderReady =
    isFetched && Boolean(chainId) && _readProvider?.network?.chainId === chainId && !isFetching
  return { readProvider: _readProvider, isReadProviderReady }
}

export default useReadProvider
