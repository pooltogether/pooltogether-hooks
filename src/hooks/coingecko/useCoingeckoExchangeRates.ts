import { useQuery, UseQueryResult } from 'react-query'
import { CoingeckoExchangeRates } from 'src/types'

import { COINGECKO_API_URL, NO_REFETCH, QUERY_KEYS } from '../../constants'

export const useCoingeckoExchangeRates = (): UseQueryResult<CoingeckoExchangeRates, unknown> => {
  return useQuery([QUERY_KEYS.getCoingeckoExchangeRates], async () => await getCoingeckoExchangeRates(), {
    staleTime: Infinity,
    enabled: true,
    ...NO_REFETCH
  })
}

export const getCoingeckoExchangeRates = async () => {
  try {
    const url = new URL(`${COINGECKO_API_URL}/exchange_rates`)
    const response = await fetch(url.toString())
    const exchangeRates: CoingeckoExchangeRates = (await response.json()).rates

    return exchangeRates
  } catch (e) {
    console.error(e.message)
    return undefined
  }
}