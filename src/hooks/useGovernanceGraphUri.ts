import { useTheGraphApiKey } from './useInitTheGraphApiKey'

const POOLTOGETHER_GOVERNANCE_GRAPH_URIS = {
  1: (apiKey) =>
    `https://gateway.thegraph.com/api/${apiKey}/subgraphs/id/0xa57d294c3a11fb542d524062ae4c5100e0e373ec-0`,
  4: () => 'https://api.thegraph.com/subgraphs/name/pooltogether/pooltogether-rinkeby-governance'
}

export const useGovernanceGraphUri = (chainId) => {
  const graphApiKey = useTheGraphApiKey()
  return POOLTOGETHER_GOVERNANCE_GRAPH_URIS[chainId]?.(graphApiKey)
}
