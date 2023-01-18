import { PrizePool } from '@pooltogether/v4-client-js'
import { useQuery } from 'react-query'

import { NO_REFETCH } from '../../constants'
import { Token } from '../../types/token'

export const getPrizePoolTokensQueryKey = (prizePool: PrizePool) => [
  'prizePoolTokens',
  prizePool?.id()
]

export const usePrizePoolTokens = (prizePool: PrizePool) => {
  return useQuery(
    getPrizePoolTokensQueryKey(prizePool),
    async () => getPrizePoolTokens(prizePool),
    { ...NO_REFETCH }
  )
}

export const getPrizePoolTokens = async (prizePool: PrizePool) => {
  const ticketDataPromise = prizePool.getTicketData()
  const tokenDataPromise = prizePool.getTokenData()

  const [ticketData, tokenData] = await Promise.all([ticketDataPromise, tokenDataPromise])

  const ticketContract = await prizePool.getTicketContract()
  const tokenContract = await prizePool.getTokenContract()

  const ticket: Token = {
    address: ticketContract.address,
    symbol: ticketData.symbol,
    name: ticketData.name,
    decimals: ticketData.decimals
  }

  const token: Token = {
    address: tokenContract.address,
    symbol: tokenData.symbol,
    name: tokenData.name,
    decimals: tokenData.decimals
  }

  return {
    prizePoolId: prizePool.id(),
    ticket,
    token
  }
}
