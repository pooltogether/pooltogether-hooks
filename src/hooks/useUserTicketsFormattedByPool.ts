import { useMemo } from 'react'
import { useQuery } from 'react-query'
import { ethers } from 'ethers'
import { formatUnits } from '@ethersproject/units'
import {
  getSubgraphClientFromVersions,
  accountQuery,
  calculateTokenValues
} from '@pooltogether/utilities'

import { QUERY_KEYS, REFETCH_INTERVAL } from '../constants'
import { useReadProviders } from './useReadProviders'
import { useEnvChainIds } from './useEnvChainIds'
import { useAllPoolsKeyedByChainId } from './usePools'
import { useSubgraphVersions } from './useSubgraphVersions'

import { batch, contract } from '@pooltogether/etherplex'

import { ERC20Abi } from '../abis/ERC20Abi'

/**
 * Flattened list of users tickets without chain information
 * @param {*} usersAddress
 * @returns
 */
export const useUserTickets = (usersAddress) => {
  const { data: userTicketsByChainIds, ...useQueryResponse } =
    useUserTicketsByChainIds(usersAddress)

  return {
    ...useQueryResponse,
    data: userTicketsByChainIds ? Object.values(userTicketsByChainIds).flat() : null
  }
}

/**
 * Fetches user's ticket and sponsorship info across multiple chains
 * tried Infura first then falls back to the Graph if there's errors
 * @param {*} usersAddress Address of user
 */
export const useUserTicketsByChainIds = (usersAddress) => {
  let subgraphIsFetched, rpcIsFetched

  const rpcUseQueryResponse = useUserTicketsByChainIdsRpc(usersAddress)
  const { error: rpcError } = rpcUseQueryResponse
  rpcIsFetched = rpcUseQueryResponse.isFetched
  let userTicketsData = rpcUseQueryResponse.data

  if (rpcError) {
    console.warn(`error fetching user tickets from rpc: `, rpcError)
  }

  const subgraphUseQueryResponse = useUserTicketsByChainIdsSubgraph(usersAddress)
  const { error: subgraphError } = subgraphUseQueryResponse
  subgraphIsFetched = subgraphUseQueryResponse.isFetched
  if (rpcError || (rpcIsFetched && !userTicketsData)) {
    userTicketsData = subgraphUseQueryResponse.data
  }

  if (subgraphError) {
    console.error(`error fetching user tickets from subgraphs: `, subgraphError)
  }

  const refetch = async () => {
    rpcUseQueryResponse.refetch()
    subgraphUseQueryResponse.refetch()
  }

  return {
    data: userTicketsData,
    isFetched: rpcIsFetched,
    rpcUseQueryResponse,
    subgraphUseQueryResponse,
    refetch
  }
}

/**
 * Fetches user data across multiple chains
 * @param {*} usersAddress Address of user
 */
export const useUserTicketsByChainIdsRpc = (usersAddress) => {
  const chainIds = useEnvChainIds()
  const { data: poolsKeyedByChainId } = useAllPoolsKeyedByChainId()

  const { readProviders, isReadProvidersReady: readProvidersAreReady } = useReadProviders(chainIds)

  const enabled =
    Boolean(poolsKeyedByChainId) &&
    Boolean(chainIds) &&
    Boolean(usersAddress) &&
    readProvidersAreReady

  return useQuery(
    [QUERY_KEYS.userTicketData, usersAddress, chainIds],
    () => getUserDataRpc(readProviders, usersAddress, chainIds, poolsKeyedByChainId),
    {
      enabled,
      refetchInterval: REFETCH_INTERVAL
    }
  )
}

/**
 * Fetches user data across multiple chains
 * @param {*} usersAddress Address of user
 * Ex. {
 *  1: ["3.1.0", "3.3.0"],
 *  136: ["3.1.0"]
 * }
 */
export const useUserTicketsByChainIdsSubgraph = (usersAddress, blockNumber = -1) => {
  const subgraphVersionsByChainId = useSubgraphVersions()

  return useQuery(
    [QUERY_KEYS.userData, usersAddress, Object.keys(subgraphVersionsByChainId)],
    () => getUserDataSubgraph(usersAddress, subgraphVersionsByChainId, blockNumber),
    {
      enabled: Boolean(usersAddress),
      refetchInterval: REFETCH_INTERVAL
    }
  )
}

/**
 * Fetches user data across multiple chains
 * @param {*} usersAddress Address of user
 */
export const useUserTicketsFormattedByPool = (usersAddress) => {
  const { data: poolsKeyedByChainId, ...allPoolsUseQueryResponse } = useAllPoolsKeyedByChainId()

  const { data: userTicketsDataByChainIds, ...userTicketsUseQueryResponse } =
    useUserTicketsByChainIds(usersAddress)

  const formattedTickets = useMemo(
    () => formatTicketsByPool(userTicketsDataByChainIds, poolsKeyedByChainId),
    [userTicketsDataByChainIds, poolsKeyedByChainId]
  )

  const refetch = async () => {
    userTicketsUseQueryResponse.refetch()
    allPoolsUseQueryResponse.refetch()
  }

  return {
    ...userTicketsUseQueryResponse,
    data: formattedTickets,
    isFetched: userTicketsUseQueryResponse.isFetched && allPoolsUseQueryResponse.isFetched,
    refetch
  }
}

// Related hooks

/**
 * Sums the total usd values of all tickets of all of the pools
 * @param {*} playersAddress
 * @returns
 */
export const usePlayerTotalPoolDepositValue = (playersAddress) => {
  const { data: playerTickets, ...playerTicketData } = useUserTicketsFormattedByPool(playersAddress)
  const totalValueUsdScaled =
    playerTickets?.reduce(
      (total, poolTickets) => total.add(poolTickets.total.totalValueUsdScaled),
      ethers.constants.Zero
    ) || ethers.constants.Zero
  return {
    ...playerTicketData,
    data: {
      totalValueUsdScaled,
      totalValueUsd: ethers.utils.formatUnits(totalValueUsdScaled, 2)
    }
  }
}

/**
 * Format player tickets for a single pool
 * @param {*} poolAddress
 * @param {*} playersAddress
 * @returns
 */
export const useUserTicketsByPool = (poolAddress, playersAddress) => {
  const { data, ...response } = useUserTicketsFormattedByPool(playersAddress)
  const poolTicketData = data?.find((poolTicketData) => poolTicketData.poolAddress === poolAddress)
  return {
    ...response,
    ...poolTicketData
  }
}

/* Utils */

const _ticketKey = (ticket) => {
  return `pool-${ticket}-ticket`
}

const _sponsorshipKey = (sponsorship) => {
  return `pool-${sponsorship}-sponsorship`
}

export const getUserDataRpc = async (
  readProviders,
  usersAddress,
  chainIds,
  poolsKeyedByChainId
) => {
  let batchCalls = []
  let ticketValues = {}
  let formattedTicketData = {}

  for (let i = 0; i < chainIds.length; i++) {
    const chainId = chainIds[i]
    const readProvider = readProviders[chainId]
    if (!readProvider) {
      return
    }

    const pools = poolsKeyedByChainId[chainId]

    pools.forEach((pool) => {
      const ticketAddress = pool.tokens.ticket.address
      const sponsorshipAddress = pool.tokens.sponsorship.address
      const etherplexTicketContract = contract(_ticketKey(ticketAddress), ERC20Abi, ticketAddress)
      const etherplexSponsorshipContract = contract(
        _sponsorshipKey(sponsorshipAddress),
        ERC20Abi,
        sponsorshipAddress
      )

      batchCalls.push(etherplexTicketContract.balanceOf(usersAddress).decimals().totalSupply())
      batchCalls.push(etherplexSponsorshipContract.balanceOf(usersAddress).decimals().totalSupply())
    })

    const batchValues = await batch(readProvider, ...batchCalls)
    ticketValues[chainId] = batchValues
  }

  if (ticketValues) {
    chainIds.forEach((chainId) => {
      formattedTicketData[chainId] = []

      const pools = poolsKeyedByChainId[chainId]

      pools.forEach((pool) => {
        const ticketAddress = pool.tokens.ticket.address
        const sponsorshipAddress = pool.tokens.sponsorship.address
        const userTicketData = ticketValues[chainId][_ticketKey(ticketAddress)]
        const userSponsorshipData = ticketValues[chainId][_sponsorshipKey(sponsorshipAddress)]

        const formatTicketObj = (chainId, ticket, address) => ({
          chainId,
          amountUnformatted: ethers.BigNumber.from(ticket.balanceOf[0]),
          amount: formatUnits(ticket.balanceOf[0], ticket.decimals[0]),
          totalSupplyUnformatted: ethers.BigNumber.from(ticket.totalSupply[0]),
          totalSupply: formatUnits(ticket.totalSupply[0], ticket.decimals[0]),
          decimals: ticket.decimals[0],
          address
          // name: ticket.name[0]
        })

        formattedTicketData[chainId].push(formatTicketObj(chainId, userTicketData, ticketAddress))
        formattedTicketData[chainId].push(
          formatTicketObj(chainId, userSponsorshipData, sponsorshipAddress)
        )
      })

      //     numberOfHolders: token.controlledToken.numberOfHolders
    })
  }

  return formattedTicketData
}

export const getUserDataSubgraph = async (usersAddress, subgraphVersionsByChainId, blockNumber) => {
  const query = accountQuery(blockNumber)
  const variables = {
    accountAddress: usersAddress.toLowerCase()
  }

  const chainIds = Object.keys(subgraphVersionsByChainId)
  const promises = []

  chainIds.forEach((chainId) => {
    const subgraphVersions = subgraphVersionsByChainId[chainId]
    const subgraphClients = getSubgraphClientFromVersions(chainId, subgraphVersions)

    subgraphVersions.forEach((version) => {
      const client = subgraphClients[version]
      promises.push(
        client
          .request(query, variables)
          .then((d) => ({ [chainId]: d?.account }))
          .catch((e) => {
            console.error(e.message)
            return null
          })
      )
    })
  })

  const ticketData = await Promise.all(promises)

  const formattedTicketData = {}
  chainIds.forEach((chainId) => {
    const userTicketDatas = ticketData
      .filter((ticketData) => {
        const dataChainId = Object.keys(ticketData)[0]
        return dataChainId === chainId
      })
      .map((ticketData) => ticketData[chainId])
      .filter(Boolean)
    formattedTicketData[chainId] = []

    userTicketDatas.forEach((userTicketData) =>
      userTicketData.controlledTokenBalances.forEach((token) => {
        formattedTicketData[chainId].push({
          chainId,
          amountUnformatted: ethers.BigNumber.from(token.balance),
          amount: formatUnits(token.balance, token.controlledToken.decimals),
          totalSupplyUnformatted: ethers.BigNumber.from(token.controlledToken.totalSupply),
          totalSupply: formatUnits(
            token.controlledToken.totalSupply,
            token.controlledToken.decimals
          ),
          decimals: token.controlledToken.decimals,
          address: token.controlledToken.id,
          name: token.controlledToken.name,
          numberOfHolders: token.controlledToken.numberOfHolders
        })
      })
    )
  })

  return formattedTicketData
}

export const formatTicketsByPool = (userTicketsDataByChainIds, poolsByChainIds) => {
  if (!userTicketsDataByChainIds || !poolsByChainIds) return null

  const formattedTickets = []
  Object.keys(poolsByChainIds).forEach((chainId) => {
    const pools = poolsByChainIds[chainId]
    const tickets = userTicketsDataByChainIds[chainId]
    pools?.forEach((pool) => {
      const ticketAddress = pool.tokens.ticket.address
      const sponsorshipAddress = pool.tokens.sponsorship.address

      const ticketData = tickets.find((ticket) => ticket.address === ticketAddress)
      const sponsorshipData = tickets.find((ticket) => ticket.address === sponsorshipAddress)

      const formattedTicket = {
        ...ticketData,
        ...calculateTokenValues(
          ticketData?.amountUnformatted || ethers.constants.Zero,
          pool.tokens.ticket.usd,
          pool.tokens.ticket.decimals
        )
      }
      const formattedSponsorship = {
        ...sponsorshipData,
        ...calculateTokenValues(
          sponsorshipData?.amountUnformatted || ethers.constants.Zero,
          pool.tokens.sponsorship.usd,
          pool.tokens.sponsorship.decimals
        )
      }
      const formattedCombined = combineTicketAndSponsorshipValues(
        formattedTicket,
        formattedSponsorship
      )

      if (formattedCombined.amountUnformatted.isZero()) return

      formattedTickets.push({
        pool,
        poolAddress: pool.prizePool.address,
        ticket: formattedTicket,
        sponsorship: formattedSponsorship,
        total: formattedCombined
      })
    })
  })

  return formattedTickets
}

const combineTicketAndSponsorshipValues = (ticket, sponsorship) => {
  const decimals = ticket.decimals
  const combinedValues = {
    totalValueUsd: undefined,
    amount: undefined,
    totalValueUsdScaled: ticket.totalValueUsdScaled.add(sponsorship.totalValueUsdScaled),
    amountUnformatted: ticket.amountUnformatted.add(sponsorship.amountUnformatted)
  }

  combinedValues.totalValueUsd = ethers.utils.formatUnits(combinedValues.totalValueUsdScaled, 2)
  combinedValues.amount = ethers.utils.formatUnits(combinedValues.amountUnformatted, decimals)

  return combinedValues
}
