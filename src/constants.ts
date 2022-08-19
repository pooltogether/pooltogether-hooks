import { contractAddresses, prizePoolContracts } from '@pooltogether/current-pool-data'
import { NETWORK } from '@pooltogether/utilities'

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
  userTicketData: 'userTicketData',
  tokens: 'tokens',
  getCoingeckoTokenPrices: 'getCoingeckoTokenPrices',
  getCoingeckoSimplePrices: 'getCoingeckoSimplePrices',
  usersPodBalance: 'usersPodBalance',
  uniswapLPStakingPool: 'uniswapLPStakingPool'
})

export const REFETCH_INTERVAL = process.env.NEXT_JS_DOMAIN_NAME ? 22 * 1000 : 16 * 1000

export const NO_REFETCH = Object.freeze({
  refetchInterval: false as false,
  refetchIntervalInBackground: false as false,
  refetchOnMount: false as false,
  refetchOnReconnect: false as false,
  refetchOnWindowFocus: false as false
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
  },
  137: {
    GovernanceToken: '0x25788a1a171ec66da6502f9975a15b609ff54cf6'
  }
}

export const CONTRACT_ADDRESSES = Object.freeze(contractAddresses)
export const PRIZE_POOL_CONTRACTS = prizePoolContracts

// CoinGecko
export const COINGECKO_API_URL = 'https://api.coingecko.com/api/v3'
export const COINGECKO_ASSET_PLATFORMS = Object.freeze({
  [NETWORK.mainnet]: 'ethereum',
  [NETWORK.bsc]: 'binance-smart-chain',
  [NETWORK.polygon]: 'polygon-pos',
  [NETWORK.celo]: 'celo',
  [NETWORK.rinkeby]: 'rinkeby',
  [NETWORK.mumbai]: 'mumbai',
  [NETWORK.avalanche]: 'avalanche',
  [NETWORK.optimism]: 'optimistic-ethereum',
  [NETWORK['optimism-kovan']]: 'optimistic-ethereum'
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
