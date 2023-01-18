import { formatUnits } from '@ethersproject/units'
import { formatUnformattedBigNumberForDisplay } from '@pooltogether/utilities'
import { PrizePool } from '@pooltogether/v4-client-js'
import { useQuery } from 'react-query'

import { Token } from '../../types/token'
import { useRefetchInterval } from '../blockchain/useRefetchInterval'
import { usePrizePoolTokens } from './usePrizePoolTokens'

export const getUsersPrizePoolBalancesQueryKey = (usersAddress: string, prizePool: PrizePool) => [
  'useUsersPrizePoolBalances',
  prizePool?.id(),
  usersAddress
]

export const useUsersPrizePoolBalances = (usersAddress: string, prizePool: PrizePool) => {
  const refetchInterval = useRefetchInterval(prizePool?.chainId)
  const { data: tokens, isFetched } = usePrizePoolTokens(prizePool)

  const enabled = Boolean(prizePool) && Boolean(usersAddress) && isFetched

  return useQuery(
    getUsersPrizePoolBalancesQueryKey(usersAddress, prizePool),
    async () => getUsersPrizePoolBalances(prizePool, usersAddress, tokens),
    {
      refetchInterval,
      enabled
    }
  )
}

export const getUsersPrizePoolBalances = async (
  prizePool: PrizePool,
  usersAddress: string,
  tokens: {
    prizePoolId: string
    token: Token
    ticket: Token
  }
) => {
  const balances = await prizePool.getUsersPrizePoolBalances(usersAddress)
  const { ticket, token } = tokens

  return {
    prizePool,
    usersAddress,
    balances: {
      ticket: {
        ...ticket,
        hasBalance: !balances.ticket.isZero(),
        amountUnformatted: balances.ticket,
        amount: formatUnits(balances.ticket, ticket.decimals),
        amountPretty: formatUnformattedBigNumberForDisplay(balances.ticket, ticket.decimals)
      },
      token: {
        ...token,
        hasBalance: !balances.token.isZero(),
        amountUnformatted: balances.token,
        amount: formatUnits(balances.token, token.decimals),
        amountPretty: formatUnformattedBigNumberForDisplay(balances.token, token.decimals)
      }
    }
  }
}
