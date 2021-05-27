import { batch, contract } from '@pooltogether/etherplex'
import { default as ERC20Abi } from './../abis/ERC20Abi'
import { formatUnits } from '@ethersproject/units'
import useReadProvider from './useReadProvider'
import { useQuery, useQueryClient } from 'react-query'
import { QUERY_KEYS } from './../constants'
import populatePerIdCache from './../utils/populatePerIdCache'

/**
 * Returns a dictionary keyed by the provided token addresses filled with
 * the provided spenders allowance for the provided user for the each token
 * @param chainId
 * @param usersAddress
 * @param spenderAddress
 * @param tokenAddresses
 * @returns
 */
const useTokenAllowances = (
  chainId: number,
  usersAddress: string,
  spenderAddress: string,
  tokenAddresses: string[]
) => {
  const { data: readProvider, isFetched: readProviderIsFetched } = useReadProvider(chainId)
  const queryClient = useQueryClient()

  const enabled =
    readProviderIsFetched &&
    Boolean(usersAddress) &&
    Boolean(spenderAddress) &&
    tokenAddresses.reduce((aggregate, current) => aggregate && Boolean(current), true) &&
    Array.isArray(tokenAddresses) &&
    tokenAddresses.length > 0

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
    batchCalls.push(tokenContract.allowance(usersAddress, spenderAddress).decimals())
  })
  const response = await batch(readProvider, ...batchCalls)
  return Object.keys(response).reduce((accumulator, current) => {
    const allowanceUnformatted = response[current].allowance[0]
    const decimals = response[current].decimals[0]
    accumulator[current] = {
      allowance: formatUnits(allowanceUnformatted, decimals),
      allowanceUnformatted,
      decimals
    }
    return accumulator
  }, {})
}

export default useTokenAllowances
