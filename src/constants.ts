import { NETWORK } from '@pooltogether/utilities'

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
  userTicketData: 'userTicketData',
  tokens: 'tokens',
  getCoingeckoTokenPrices: 'getCoingeckoTokenPrices',
  getCoingeckoSimplePrices: 'getCoingeckoSimplePrices',
  usersPodBalance: 'usersPodBalance',
  uniswapLPStakingPool: 'uniswapLPStakingPool'
})

export const NO_REFETCH = Object.freeze({
  refetchInterval: false as false,
  refetchIntervalInBackground: false as false,
  refetchOnMount: false as false,
  refetchOnReconnect: false as false,
  refetchOnWindowFocus: false as false
})

// CoinGecko
export const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'
export const COINGECKO_ASSET_PLATFORMS = Object.freeze({
  [NETWORK.mainnet]: 'ethereum',
  [NETWORK.bsc]: 'binance-smart-chain',
  [NETWORK.polygon]: 'polygon-pos',
  [NETWORK.celo]: 'celo',
  [NETWORK.goerli]: 'goerli',
  [NETWORK.mumbai]: 'mumbai',
  [NETWORK.avalanche]: 'avalanche',
  [NETWORK.optimism]: 'optimistic-ethereum',
  [NETWORK['optimism-kovan']]: 'optimistic-ethereum',
  [NETWORK['optimism-goerli']]: 'optimistic-ethereum'
})

export enum ProposalStatus {
  pending = 'pending',
  active = 'active',
  cancelled = 'cancelled',
  defeated = 'defeated',
  succeeded = 'succeeded',
  queued = 'queued',
  expired = 'expired',
  executed = 'executed'
}

// Note: Order matches contracts
export const PROPOSAL_STATES = [
  ProposalStatus.pending,
  ProposalStatus.active,
  ProposalStatus.cancelled,
  ProposalStatus.defeated,
  ProposalStatus.succeeded,
  ProposalStatus.queued,
  ProposalStatus.expired,
  ProposalStatus.executed
]
