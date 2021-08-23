import { contractAddresses, prizePoolContracts } from '@pooltogether/current-pool-data'

export const SELECTED_WALLET_COOKIE_KEY = 'selectedWallet'

export const QUERY_KEYS = Object.freeze({
  claimablePoolFromTokenFaucets: 'claimablePoolFromTokenFaucets',
  getCoingeckoTokenData: 'getCoingeckoTokenData',
  prizePeriod: 'prizePeriod',
  poolTokenDataQuery: 'poolTokenDataQuery',
  readProvider: 'readProvider',
  readProviders: 'readProviders',
  retroactivePoolClaimDataQuery: 'retroactivePoolClaimDataQuery',
  tokenAllowances: 'tokenAllowances',
  tokenBalances: 'tokenBalances',
  tokenHolderQuery: 'tokenHolderQuery',
  usePool: 'usePool',
  usePools: 'usePools',
  usePoolsByChainId: 'usePoolsByChainId',
  userData: 'userData',
  userTicketData: 'userTicketData'
})

export const REFETCH_INTERVAL = process.env.NEXT_JS_DOMAIN_NAME ? 22 * 1000 : 16 * 1000

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
    GovernanceReserve: '0xdb8E47BEFe4646fCc62BE61EEE5DF350404c124F',
    MerkleDistributor: '0xBE1a33519F586A4c8AA37525163Df8d67997016f'
  },
  4: {
    GovernorAlpha: '0x9B63243CD27102fbEc9FAf67CA1a858dcC16Ee01',
    GovernanceToken: '0xc4E90a8Dc6CaAb329f08ED3C8abc6b197Cf0F40A',
    GovernanceReserve: '0xA5224da01a5A792946E4270a02457EB75412c84c',
    MerkleDistributor: '0x93a6540DcE05a4A5E5B906eB97bBCBb723768F2D'
  }
}

export const CONTRACT_ADDRESSES = Object.freeze(contractAddresses)
export const PRIZE_POOL_CONTRACTS = prizePoolContracts
