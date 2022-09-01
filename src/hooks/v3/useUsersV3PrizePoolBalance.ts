import { useMemo } from 'react'
import { useAllUsersV3Balances } from './useAllUsersV3Balances'

export const useUsersV3PrizePoolBalance = (
  usersAddress: string,
  chainId: number,
  prizePoolAddress: string,
  ticketAddress: string
) => {
  const queriesResult = useAllUsersV3Balances(usersAddress)

  return useMemo(() => {
    const refetch = async () => queriesResult?.forEach((queryResult) => queryResult.refetch())
    const isFetched = queriesResult?.every((queryResult) => queryResult.isFetched)
    const isFetching = queriesResult?.some((queryResult) => queryResult.isFetching)

    const balances = queriesResult
      ?.find((qr) => {
        return (
          !!qr &&
          qr?.isFetched &&
          qr?.data?.['chainId'] === chainId &&
          qr?.data?.['balances'].some(
            (b) =>
              b.prizePool.addresses.prizePool === prizePoolAddress &&
              b.prizePool.addresses.ticket === ticketAddress
          )
        )
      })
      ?.data['balances'].find(
        (b) =>
          b.prizePool.addresses.prizePool === prizePoolAddress &&
          b.prizePool.addresses.ticket === ticketAddress
      )

    return {
      isFetching,
      isFetched,
      refetch,
      data: balances
    }
  }, [queriesResult])
}
