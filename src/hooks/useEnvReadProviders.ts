import { useEnvChainIds } from './useEnvChainIds'
import { useReadProviders } from './useReadProviders'

/**
 *
 * @returns Providers for all environment chain ids
 */
export const useEnvReadProviders = () => {
  const chainIds = useEnvChainIds()
  return useReadProviders(chainIds)
}
