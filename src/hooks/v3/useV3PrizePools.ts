import { Provider } from '@ethersproject/abstract-provider'
import { getAddress } from '@ethersproject/address'
import { batch, Context, contract } from '@pooltogether/etherplex'
import { V3 } from '@pooltogether/utilities'
import { getReadProviders } from '@pooltogether/wallet-connection'
import { useQuery } from 'react-query'
import { ERC20Abi } from '../../abis/ERC20Abi'
import { PodAbi } from '../../abis/PodAbi'
import PrizePool_3_3_0 from '../../abis/PrizePool_3_3_0'
import { PrizeStrategyAbi_3_4_4 } from '../../abis/PrizeStrategy_3_4_4'
import { Amount, Token } from '../../types/token'
import { getAmountFromBigNumber } from '../../utils/getAmountFromBigNumber'
import { useV3ChainIds } from './useV3ChainIds'

export interface PodToken extends Token {
  pricePerShare: Amount
}

export interface V3PrizePool {
  chainId: number
  addresses: {
    prizePool: string
    prizeStrategy: string
    token: string
    ticket: string
    sponsorship: string
    pod?: string
    tokenFaucets?: string[]
  }
  tokens: {
    token: Token
    ticket: Token
    sponsorship: Token
    podStablecoin?: PodToken
  }
}

/**
 * Fetches v3 Prize Pool contract addresses and token data
 * @returns
 */
export const useV3PrizePools = () => {
  const chainIds = useV3ChainIds()
  const providers = getReadProviders(chainIds)
  return useQuery(['useV3PrizePools', chainIds], () => getV3PrizePools(chainIds, providers))
}

/**
 * Fetch all of the data on a per chain id basis and merge data
 * @param chainIds
 * @param providers
 * @returns
 */
const getV3PrizePools = async (
  chainIds: number[],
  providers: {
    [chainId: number]: Provider
  }
) => {
  const prizePoolAddressByChainId = getPrizePoolAddresses(chainIds)

  const prizePoolsByChainId: {
    [chainId: number]: V3PrizePool[]
  } = {}

  await Promise.allSettled(
    chainIds.map(async (chainId) => {
      const prizePoolAddresses = prizePoolAddressByChainId[chainId]
      try {
        const prizePools = await getPrizePools(chainId, providers[chainId], prizePoolAddresses)
        prizePoolsByChainId[chainId] = prizePools
      } catch (e) {
        console.error(e.message)
      }
    })
  )

  return prizePoolsByChainId
}

/**
 * Filter the constant for just the prize pool addresses
 * @param chainIds
 * @returns
 */
const getPrizePoolAddresses = (chainIds: number[]) => {
  const prizePoolAddresses: {
    [chainId: number]: string[]
  } = {}

  chainIds?.forEach((chainId) => {
    prizePoolAddresses[chainId] =
      V3.PRIZE_POOL_ADDRESSES?.[chainId]?.map((prizePool) => prizePool.prizePool) || []
  })

  return prizePoolAddresses
}

/**
 
 * @param chainIds
 * @returns
 */
const getPrizePoolTokenFaucetAddresses = (chainId: number, prizePoolAddress: string) =>
  V3.PRIZE_POOL_ADDRESSES?.[chainId]?.find(({ prizePool }) => prizePool === prizePoolAddress)
    ?.tokenFaucets || []

/**
 * Fetch the prize pool contract addresses and then the token data
 * @param provider
 * @param prizePoolAddresses
 * @returns
 */
const getPrizePools = async (chainId: number, provider: Provider, prizePoolAddresses: string[]) => {
  let batchRequests: Context[] = []

  if (!prizePoolAddresses.length) {
    return []
  }

  // Fetch addresses from Prize Pool contract
  prizePoolAddresses.forEach((prizePoolAddress) => {
    const prizePoolContract = contract(prizePoolAddress, PrizePool_3_3_0, prizePoolAddress)
    batchRequests.push(prizePoolContract.prizeStrategy().token())
  })

  const prizePoolContractAddressesResults = await batch(provider, ...batchRequests)
  batchRequests = []

  // Fetch addresses from Prize Strategy contract
  prizePoolAddresses.forEach((prizePoolAddress) => {
    const prizeStrategyAddress =
      prizePoolContractAddressesResults[prizePoolAddress].prizeStrategy[0]
    const prizeStrategyContract = contract(
      prizeStrategyAddress,
      PrizeStrategyAbi_3_4_4,
      prizeStrategyAddress
    )

    batchRequests.push(prizeStrategyContract.sponsorship().ticket())
  })
  const prizeStrategyContractAddressesResults = await batch(provider, ...batchRequests)
  batchRequests = []

  // Fetch Token data for prize pools
  prizePoolAddresses.forEach((prizePoolAddress) => {
    const prizeStrategyAddress =
      prizePoolContractAddressesResults[prizePoolAddress].prizeStrategy[0]
    const tokenAddress = prizePoolContractAddressesResults[prizePoolAddress].token[0]
    const prizeStrategyAddresses = prizeStrategyContractAddressesResults[prizeStrategyAddress]

    const ticketAddress = prizeStrategyAddresses.ticket[0]
    const sponsorshipTicketAddress = prizeStrategyAddresses.sponsorship[0]

    const ticketContract = contract(ticketAddress, ERC20Abi, ticketAddress)
    const tokenContract = contract(tokenAddress, ERC20Abi, tokenAddress)
    const sponsorshipTicketContract = contract(
      sponsorshipTicketAddress,
      ERC20Abi,
      sponsorshipTicketAddress
    )

    batchRequests.push(
      ticketContract
        .name()
        .symbol()
        .decimals(),
      tokenContract
        .name()
        .symbol()
        .decimals(),
      sponsorshipTicketContract
        .name()
        .symbol()
        .decimals()
    )

    // Fetch Pod data
    const podAddress = getPodAddress(chainId, prizePoolAddress)
    if (!!podAddress) {
      const podStablecoinContract = contract(podAddress, PodAbi, podAddress)
      batchRequests.push(
        podStablecoinContract
          .name()
          .symbol()
          .decimals()
          .getPricePerShare()
      )
    }
  })
  const tokenResults = await batch(provider, ...batchRequests)
  batchRequests = []

  const v3PrizePools: V3PrizePool[] = []

  // Final, build
  prizePoolAddresses.forEach((prizePoolAddress) => {
    const prizePoolContractAddresses = prizePoolContractAddressesResults[prizePoolAddress]
    const prizeStrategyAddress = prizePoolContractAddresses.prizeStrategy[0]
    const prizeStategyContractAddresses =
      prizeStrategyContractAddressesResults[prizeStrategyAddress]

    const tokenAddress = prizePoolContractAddresses.token[0]
    const ticketAddress = prizeStategyContractAddresses.ticket[0]
    const sponsorshipAddress = prizeStategyContractAddresses.sponsorship[0]

    const token = makeToken(tokenAddress, tokenResults[tokenAddress])
    const ticket = makeToken(ticketAddress, tokenResults[ticketAddress])
    const sponsorship = makeToken(sponsorshipAddress, tokenResults[sponsorshipAddress])

    const podAddress = getPodAddress(chainId, prizePoolAddress)
    const podStablecoin = podAddress ? makePodToken(podAddress, tokenResults[podAddress]) : null

    v3PrizePools.push({
      chainId,
      addresses: {
        prizePool: prizePoolAddress,
        prizeStrategy: prizeStrategyAddress,
        token: tokenAddress,
        ticket: ticketAddress,
        sponsorship: sponsorshipAddress,
        pod: podAddress,
        tokenFaucets: getPrizePoolTokenFaucetAddresses(chainId, prizePoolAddress)
      },
      tokens: {
        token,
        ticket,
        sponsorship,
        podStablecoin
      }
    })
  })

  return v3PrizePools
}

/**
 * Convert an etherplex response to a Token
 * @param tokenAddress
 * @param etherplexTokenResponse
 * @returns
 */
const makeToken = (tokenAddress: string, etherplexTokenResponse): Token => {
  return {
    address: tokenAddress,
    symbol: etherplexTokenResponse.symbol[0],
    name: etherplexTokenResponse.name[0],
    decimals: etherplexTokenResponse.decimals[0]
  }
}

/**
 * Convert an etherplex response to a PodToken
 * @param tokenAddress
 * @param etherplexTokenResponse
 * @returns
 */
const makePodToken = (tokenAddress: string, etherplexTokenResponse): PodToken => {
  return {
    address: tokenAddress,
    symbol: etherplexTokenResponse.symbol[0],
    name: etherplexTokenResponse.name[0],
    decimals: etherplexTokenResponse.decimals[0],
    pricePerShare: getAmountFromBigNumber(
      etherplexTokenResponse.getPricePerShare[0],
      etherplexTokenResponse.decimals[0]
    )
  }
}

/**
 * Finds pod data in the pod addresses constant
 * @param chainId
 * @param prizePoolAddress
 * @returns
 */
const getPodAddress = (chainId: number, prizePoolAddress: string) => {
  const pods = V3.POD_ADDRESSES?.[chainId]
  return pods
    ? pods.find((pod) => getAddress(pod.prizePool) === getAddress(prizePoolAddress))?.pod
    : null
}
