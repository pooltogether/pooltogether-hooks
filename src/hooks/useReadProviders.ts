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
export const useReadProviders = (chainIds) => {
  const infuraId = useInfuraId()
  const quickNodeId = useQuickNodeId()

  const {
    data: _readProviders,
    isFetched,
    isFetching
  } = useQuery<{ [chainId: string]: ethers.providers.BaseProvider }, Error>(
    [QUERY_KEYS.readProviders, chainIds, infuraId, quickNodeId],
    () => getReadProviders(chainIds, infuraId, quickNodeId),
    {
      ...NO_REFETCH_QUERY_OPTIONS,
      enabled: Boolean(infuraId) && Boolean(chainIds) && Boolean(quickNodeId)
    }
  )

  const areProvidersForAllChainIdsRequestedReady = chainIds
    ? chainIds.reduce((allReady, chainId) => {
        return _readProviders?.[chainId]?.network?.chainId === chainId && allReady
      }, true)
    : false

  const isReadProvidersReady = isFetched && areProvidersForAllChainIdsRequestedReady && !isFetching

  return { readProviders: _readProviders, isReadProvidersReady }
}

const getReadProviders = async (chainIds, infuraId, quickNodeId) => {
  const readProviders = {}
  for (const chainId of chainIds) {
    readProviders[chainId] = await readProvider(chainId, infuraId, quickNodeId)
  }
  return readProviders
}
