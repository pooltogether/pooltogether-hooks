import { useQuery, useQueryClient } from 'react-query'
import { NETWORK } from '@pooltogether/utilities'

import { APP_ENVIRONMENT, useAppEnv } from './useAppEnv'
import { QUERY_KEYS } from '../constants'
import { useGovernancePoolContracts, usePoolContractBySymbol } from './usePoolContracts'
import { useRouterChainId } from './useRouterChainId'
import { getPool, getPoolsByChainId } from '../fetchers/getPools'

const REFETCH_INTERVAL = process.env.NEXT_JS_DOMAIN_NAME ? 22 * 1000 : 16 * 1000

/**
 * Fetches pool graph data, chain data, token prices, lootbox data & merges it all.
 * Returns a flat list of pools
 * @returns
 */
export const useAllPools = () => {
  const { data: poolsByChainId, ...useAllPoolsResponse } = useAllPoolsKeyedByChainId()
  let pools = poolsByChainId ? Object.values(poolsByChainId).flat() : null
  pools = pools?.filter(Boolean)
  return { ...useAllPoolsResponse, data: pools }
}

/**
 * Fetches pool graph data, chain data, token prices, lootbox data & merges it all
 * @returns
 */
export const useAllPoolsKeyedByChainId = () => {
  const queryClient = useQueryClient()

  const { appEnv } = useAppEnv()

  const ethereumChainId = appEnv === APP_ENVIRONMENT.mainnets ? NETWORK.mainnet : NETWORK.rinkeby
  const polygonChainId = appEnv === APP_ENVIRONMENT.mainnets ? NETWORK.matic : NETWORK.mumbai
  const bscChainId = appEnv === APP_ENVIRONMENT.mainnets ? NETWORK.bsc : null

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

  const error = ethereumUseQuery.error || polygonUseQuery.error || bscUseQuery.error

  const refetch = () => {
    ethereumUseQuery.refetch()
    polygonUseQuery.refetch()
    bscUseQuery.refetch()
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

// Utils

const filterPoolData = (data, contractsByChainId) => {
  // console.log(data, contractsByChainId)
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
