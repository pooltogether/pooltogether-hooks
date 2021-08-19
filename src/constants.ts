import { contractAddresses, prizePoolContracts } from '@pooltogether/current-pool-data'

export const SELECTED_WALLET_COOKIE_KEY = 'selectedWallet'

export const QUERY_KEYS = Object.freeze({
  claimablePoolFromTokenFaucets: 'claimablePoolFromTokenFaucets',
  getCoingeckoTokenData: 'getCoingeckoTokenData',
  prizePeriod: 'prizePeriod',
  readProvider: 'readProvider',
  readProviders: 'readProviders',
  retroactivePoolClaimDataQuery: 'retroactivePoolClaimDataQuery',
  tokenBalances: 'tokenBalances',
  tokenAllowances: 'tokenAllowances',
  usePool: 'usePool',
  usePools: 'usePools',
  usePoolsByChainId: 'usePoolsByChainId',
})

export const NO_REFETCH_QUERY_OPTIONS: {
  refetchInterval: false
  refetchOnReconnect: false
  refetchOnWindowFocus: false
  staleTime: number
} = Object.freeze({
  refetchInterval: false,
  refetchOnReconnect: false,
  refetchOnWindowFocus: false,
  staleTime: Infinity
})

export const GOVERNANCE_CONTRACT_ADDRESSES = {
  1: {
    GovernorAlpha: '0xB3a87172F555ae2a2AB79Be60B336D2F7D0187f0',
    GovernanceToken: '0x0cEC1A9154Ff802e7934Fc916Ed7Ca50bDE6844e',
    GovernanceReserve: '0xdb8E47BEFe4646fCc62BE61EEE5DF350404c124F'
  },
  4: {
    GovernorAlpha: '0x9B63243CD27102fbEc9FAf67CA1a858dcC16Ee01',
    GovernanceToken: '0xc4E90a8Dc6CaAb329f08ED3C8abc6b197Cf0F40A',
    GovernanceReserve: '0xA5224da01a5A792946E4270a02457EB75412c84c'
  }
}

export const CONTRACT_ADDRESSES = Object.freeze(contractAddresses)
export const PRIZE_POOL_CONTRACTS = prizePoolContracts
