import { ethers } from 'ethers'
import { useQuery } from 'react-query'

import { NO_REFETCH_QUERY_OPTIONS, QUERY_KEYS } from '../constants'
import { readProvider } from '../services/readProvider'

/**
 *
 * @param {*} chainId a chainId to get a provider for
 * @returns Providers for the provided chain id
 */
const useReadProviders = (chainIds) => {
  const {
    data: _readProviders,
    isFetched,
    isFetching
  } = useQuery<{ [chainId: string]: ethers.providers.BaseProvider }, Error>(
    [QUERY_KEYS.readProvider, chainIds],
    () => getReadProviders(chainIds),
    {
      ...NO_REFETCH_QUERY_OPTIONS
    }
  )

  const areProvidersForAllChainIdsRequestedReady = chainIds.reduce((allReady, chainId) => {
    return _readProviders?.[chainId]?.network?.chainId === chainId && allReady
  }, true)

  const isReadProvidersReady = isFetched && areProvidersForAllChainIdsRequestedReady && !isFetching

  return { readProviders: _readProviders, isReadProvidersReady }
}

const getReadProviders = async (chainIds) => {
  const readProviders = {}
  for (const chainId of chainIds) {
    readProviders[chainId] = await readProvider(chainId)
  }
  return readProviders
}

export default useReadProviders
