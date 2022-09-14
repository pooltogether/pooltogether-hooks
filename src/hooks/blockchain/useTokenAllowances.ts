import { batch, contract } from '@pooltogether/etherplex'
import { useQuery, useQueryClient } from 'react-query'
import { ERC20Abi } from '../../abis/ERC20Abi'
import { NO_REFETCH, QUERY_KEYS } from '../../constants'
import { populatePerIdCache } from '../../utils/populatePerIdCache'
import { BigNumber } from 'ethers'
import { getReadProvider } from '@pooltogether/wallet-connection'

/**
 * Returns a dictionary keyed by the provided token addresses filled with
 * the provided spenders allowance for the provided user for the each token
 * @param chainId
 * @param usersAddress
 * @param spenderAddress
 * @param tokenAddresses
 * @returns
 */
export const useTokenAllowances = (
  chainId: number,
  usersAddress: string,
  spenderAddress: string,
  tokenAddresses: string[]
) => {
  const readProvider = getReadProvider(chainId)
  const queryClient = useQueryClient()

  const enabled =
    Boolean(usersAddress) &&
    Boolean(spenderAddress) &&
    tokenAddresses.reduce((aggregate, current) => aggregate && Boolean(current), true) &&
    Array.isArray(tokenAddresses) &&
    tokenAddresses.length > 0 &&
    Boolean(chainId)

  const getCacheKey = (id: (string | number)[]) => [
    QUERY_KEYS.tokenAllowances,
    chainId,
    usersAddress,
    spenderAddress,
    id
  ]

  return useQuery(
    getCacheKey(tokenAddresses),
    async () =>
      await getTokenAllowances(readProvider, usersAddress, spenderAddress, tokenAddresses),
    {
      ...NO_REFETCH,
      enabled,
      onSuccess: (data) => populatePerIdCache(queryClient, getCacheKey, data)
    }
  )
}

/**
 * Returns the provided spenders allowance for the provided user for the provided token
 * @param chainId
 * @param usersAddress
 * @param spenderAddress
 * @param tokenAddress
 * @returns
 */
export const useTokenAllowance = (
  chainId: number,
  usersAddress: string,
  spenderAddress: string,
  tokenAddress: string
) => {
  const { data: tokenAllowances, ...queryData } = useTokenAllowances(
    chainId,
    usersAddress,
    spenderAddress,
    [tokenAddress]
  )
  return { ...queryData, data: tokenAllowances ? tokenAllowances[tokenAddress] : null }
}

const getTokenAllowances = async (readProvider, usersAddress, spenderAddress, tokenAddresses) => {
  const batchCalls = []
  tokenAddresses.map((tokenAddress) => {
    const tokenContract = contract(tokenAddress, ERC20Abi, tokenAddress)
    batchCalls.push(tokenContract.allowance(usersAddress, spenderAddress))
  })
  const response = await batch(readProvider, ...batchCalls)
  const result: {
    [tokenAddress: string]: BigNumber
  } = {}
  Object.keys(response).map((tokenAddress) => {
    const allowanceUnformatted = response[tokenAddress].allowance[0]
    result[tokenAddress] = allowanceUnformatted
  })
  return result
}
