import { useQuery } from 'react-query'

import { QUERY_KEYS } from '../constants'
import { readProvider } from '../services/readProvider'

/**
 *
 * @param {*} chainId a chainId to get a provider for
 * @returns Providers for the provided chain id
 */
const useReadProvider = (chainId) =>
  useQuery([QUERY_KEYS.readProvider, chainId], () => readProvider(chainId))

export default useReadProvider
