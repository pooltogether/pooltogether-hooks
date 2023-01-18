import { getAmountFromUnformatted } from '@pooltogether/utilities'
import { BigNumber } from 'ethers'
import { useMemo } from 'react'

import { Amount, TokenWithUsdBalance } from '../../types/token'
import { useAllUsersV3Balances } from './useAllUsersV3Balances'
import { V3PrizePool } from './useV3PrizePools'

/**
 * Returns a users balances for V3 Prize Pools.
 * Filters zero balances.
 * @param usersAddress
 * @param filterAdditionalPools
 * @returns
 */
export const useUsersV3PrizePoolBalances = (usersAddress: string) => {
  const queriesResult = useAllUsersV3Balances(usersAddress)

  return useMemo(() => {
    const refetch = async () => queriesResult?.forEach((queryResult) => queryResult.refetch())
    const isFetched = queriesResult?.every((queryResult) => queryResult.isFetched)
    const isFetching = queriesResult?.some((queryResult) => queryResult.isFetching)

    const balances: {
      chainId: number
      ticket: TokenWithUsdBalance
      token: TokenWithUsdBalance
      prizePool: V3PrizePool
      pricePerShare?: Amount
      isPod?: boolean
      isSponsorship?: boolean
    }[] = []

    let totalValueUsdScaled = BigNumber.from(0)

    queriesResult.forEach((queryResult) => {
      const { data, isFetched } = queryResult
      if (isFetched && !!data) {
        data['balances'].forEach((balance) => {
          balances.push(balance)
          totalValueUsdScaled = totalValueUsdScaled.add(balance.ticket.balanceUsdScaled)
        })
      }
    })

    const totalValueUsd = getAmountFromUnformatted(totalValueUsdScaled, '2')

    return {
      isFetching,
      isFetched,
      refetch,
      data: { balances, totalValueUsd, totalValueUsdScaled }
    }
  }, [queriesResult])
}
