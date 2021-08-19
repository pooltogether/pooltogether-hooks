import { getChainIdByAlias } from '@pooltogether/utilities'

export const useRouterChainId = (router) => {
  const networkName = router?.query?.networkName
  return getChainIdByAlias(networkName)
}
