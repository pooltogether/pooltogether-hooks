import { batch, contract } from '@pooltogether/etherplex'
import { default as ERC20Abi } from './../abis/ERC20Abi'
import { formatUnits } from '@ethersproject/units'
import useReadProvider from './useReadProvider'
import { useQuery, useQueryClient } from 'react-query'
import { QUERY_KEYS } from './../constants'
import populatePerIdCache from './../utils/populatePerIdCache'

/**
 * Returns a dictionary keyed by the token addresses filled with
 * the provided addresses balances of the provided tokens
 * @param chainId
 * @param address
 * @param tokenAddresses
 * @returns
 */
const useTokenBalances = (chainId: number, address: string, tokenAddresses: string[]) => {
  const { data: readProvider, isFetched: readProviderIsFetched } = useReadProvider(chainId)
  const queryClient = useQueryClient()

  const enabled =
    readProviderIsFetched &&
    Boolean(address) &&
    tokenAddresses.reduce((aggregate, current) => aggregate && Boolean(current), true) &&
    Array.isArray(tokenAddresses) &&
    tokenAddresses.length > 0

  const getCacheKey = (id: (string | number)[]) => [QUERY_KEYS.tokenBalances, chainId, address, id]

  return useQuery(
    getCacheKey(tokenAddresses),
    async () => await getTokenBalances(readProvider, address, tokenAddresses),
    {
      enabled,
      onSuccess: (data) => populatePerIdCache(queryClient, getCacheKey, data)
    }
  )
}

/**
 * Returns the provided addresses balance of the provided token
 * @param chainId
 * @param usersAddress
 * @param spenderAddress
 * @param tokenAddress
 * @returns
 */
export const useTokenBalance = (chainId: number, address: string, tokenAddress: string) => {
  const { data: tokenBalances, ...queryData } = useTokenBalances(chainId, address, [tokenAddress])
  return { ...queryData, data: tokenBalances ? tokenBalances[tokenAddress] : null }
}

const getTokenBalances = async (readProvider, address, tokenAddresses) => {
  const batchCalls = []
  tokenAddresses.map((tokenAddress) => {
    const tokenContract = contract(tokenAddress, ERC20Abi, tokenAddress)
    batchCalls.push(tokenContract.balanceOf(address).decimals().name().symbol())
  })
  const response = await batch(readProvider, ...batchCalls)
  return Object.keys(response).reduce((accumulator, current) => {
    const amountUnformatted = response[current].balanceOf[0]
    const decimals = response[current].decimals[0]
    const name = response[current].name[0]
    const symbol = response[current].symbol[0]
    accumulator[current] = {
      amount: formatUnits(amountUnformatted, decimals),
      amountUnformatted,
      decimals,
      name,
      symbol
    }
    return accumulator
  }, {})
}

export default useTokenBalances
