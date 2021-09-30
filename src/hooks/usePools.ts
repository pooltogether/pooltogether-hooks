import { useQuery, useQueryClient } from 'react-query'
import { NETWORK, getChainIdByAlias } from '@pooltogether/utilities'

import { useIsTestnets } from './useIsTestnets'
import { QUERY_KEYS, REFETCH_INTERVAL } from '../constants'
import { useGovernancePoolContracts, usePoolContractBySymbol } from './usePoolContracts'
import { getPool, getPoolsByChainId } from '../fetchers/getPools'

/**
 * Fetches pool graph data, chain data, token prices, lootbox data & merges it all.
 * Returns a flat list of pools
 * @returns
 */
export const useAllPools = () => {
  const { data: poolsByChainId, ...useAllPoolsResponse } = useAllPoolsKeyedByChainId()
  let pools: any = poolsByChainId ? Object.values(poolsByChainId).flat() : null
  pools = pools?.filter(Boolean)
  return { ...useAllPoolsResponse, data: pools }
}

/**
 * Fetches pool graph data, chain data, token prices, lootbox data & merges it all
 * @returns
 */
export const useAllPoolsKeyedByChainId = () => {
  const queryClient = useQueryClient()

  const { isTestnets } = useIsTestnets()

  const ethereumChainId = !isTestnets ? NETWORK.mainnet : NETWORK.rinkeby
  const polygonChainId = !isTestnets ? NETWORK.matic : NETWORK.mumbai
  const bscChainId = !isTestnets ? NETWORK.bsc : null
  const celoChainId = !isTestnets ? NETWORK.celo : null

  const { data: ethereumPools, ...ethereumUseQuery } = useQuery(
    getUsePoolsQueryKey(ethereumChainId),
    async () => await getPoolsByChainId(ethereumChainId),
    {
      onSuccess: (data) => populatePerPoolCache(ethereumChainId, queryClient, data),
      refetchInterval: REFETCH_INTERVAL
    }
  )

  const { data: polygonPools, ...polygonUseQuery } = useQuery(
    getUsePoolsQueryKey(polygonChainId),
    async () => await getPoolsByChainId(polygonChainId),
    {
      onSuccess: (data) => populatePerPoolCache(polygonChainId, queryClient, data),
      refetchInterval: REFETCH_INTERVAL
    }
  )

  const { data: bscPools, ...bscUseQuery } = useQuery(
    getUsePoolsQueryKey(bscChainId),
    async () => await getPoolsByChainId(bscChainId),
    {
      onSuccess: (data) => populatePerPoolCache(bscChainId, queryClient, data),
      refetchInterval: REFETCH_INTERVAL,
      enabled: Boolean(bscChainId)
    }
  )

  const { data: celoPools, ...celoUseQuery } = useQuery(
    getUsePoolsQueryKey(celoChainId),
    async () => await getPoolsByChainId(celoChainId),
    {
      onSuccess: (data) => populatePerPoolCache(celoChainId, queryClient, data),
      refetchInterval: REFETCH_INTERVAL,
      enabled: Boolean(celoChainId)
    }
  )

  const error =
    ethereumUseQuery.error || polygonUseQuery.error || bscUseQuery.error || celoUseQuery.error

  const refetch = () => {
    ethereumUseQuery.refetch()
    polygonUseQuery.refetch()
    bscUseQuery.refetch()
    celoUseQuery.refetch()
  }

  const isFetched = ethereumUseQuery.isFetched && polygonUseQuery.isFetched
  let data = null
  if (ethereumUseQuery.isFetched) {
    if (!data) {
      data = {}
    }
    if (ethereumPools) {
      data[ethereumChainId] = ethereumPools
    }
  }
  if (polygonUseQuery.isFetched) {
    if (!data) {
      data = {}
    }
    if (polygonPools) {
      data[polygonChainId] = polygonPools
    }
  }
  if (bscUseQuery.isFetched && bscChainId) {
    if (!data) {
      data = {}
    }
    if (bscPools) {
      data[bscChainId] = bscPools
    }
  }
  if (celoUseQuery.isFetched && celoChainId) {
    if (!data) {
      data = {}
    }
    if (celoPools) {
      data[celoChainId] = celoPools
    }
  }

  return { data, isFetched, refetch, error }
}

/**
 *
 * @param {*} chainId
 * @param {*} poolAddress
 * @returns
 */
export const usePoolByChainId = (chainId, poolAddress) => {
  const enabled = Boolean(poolAddress) && Boolean(chainId)

  return useQuery(
    getUsePoolQueryKey(chainId, poolAddress),
    async () => await getPool(chainId, poolAddress),
    {
      enabled,
      refetchInterval: REFETCH_INTERVAL
    }
  )
}

/**
 * When the usePools query has returned, split the list of pools and
 * update cache for individual pools
 * @param {*} chainId
 * @param {*} queryClient
 * @param {*} pools
 * @returns
 */
const populatePerPoolCache = (chainId, queryClient, pools) =>
  pools?.forEach((pool) => {
    queryClient.setQueryData(getUsePoolQueryKey(chainId, pool.prizePool.address), pool)
  })

// Variants

/**
 * Reads the route and looks for a symbol
 * @returns
 */
export const useCurrentPool = (router) => {
  const chainId = useRouterChainId(router)
  return usePoolBySymbol(chainId, router?.query?.symbol)
}

/**
 *
 * @param {*} poolAddress
 * @returns
 */
export const usePoolByAddress = (chainId, poolAddress) => {
  return usePoolByChainId(chainId, poolAddress)
}

// function getMainImageUrl(images: Images): string {
//   return images.main;
// }

/**
 *
 * @param {*} symbol
 * @returns
 */
export const usePoolBySymbol = (chainId, symbol) => {
  const poolContract = usePoolContractBySymbol(symbol)
  return usePoolByChainId(chainId, poolContract?.prizePool?.address)
}

/**
 *
 * @returns
 */
export const useGovernancePools = () => {
  const governanceContracts = useGovernancePoolContracts()
  const useAllPoolsData = useAllPoolsKeyedByChainId()

  const pools = useAllPoolsData.data
    ? Object.values(filterPoolData(useAllPoolsData.data, governanceContracts)).flat()
    : null

  return {
    ...useAllPoolsData,
    data: pools
  }
}

export const useRouterChainId = (router) => {
  const networkName = router?.query?.networkName
  return getChainIdByAlias(networkName)
}

// Utils

const filterPoolData = (data, contractsByChainId) => {
  return Object.keys(data).reduce((filteredPoolsByChainId, chainId) => {
    const pools = data[chainId]
    const contracts = contractsByChainId[chainId] || []

    const filteredPools = []
    contracts.forEach((contract) => {
      const pool = pools?.find(
        (pool) => pool.prizePool.address.toLowerCase() === contract.prizePool.address.toLowerCase()
      )
      if (!pool) return
      filteredPools.push(pool)
    })

    filteredPoolsByChainId[chainId] = filteredPools
    return filteredPoolsByChainId
  }, {})
}

/**
 * Standardize the query key for use in cache population
 * @param {*} chainIds
 * @returns
 */
const getUsePoolsQueryKey = (chainIds) => [QUERY_KEYS.usePools, chainIds]

/**
 * Standardize the query key for use in cache population
 * @param {*} chainId
 * @returns
 */
const getUsePoolsByChainIdQueryKey = (chainId) => [QUERY_KEYS.usePoolsByChainId, chainId]

/**
 * Standardize the query key for use in cache population
 * @param {*} chainId
 * @param {*} poolAddress
 * @returns
 */
const getUsePoolQueryKey = (chainId, poolAddress) => [QUERY_KEYS.usePool, chainId, poolAddress]
