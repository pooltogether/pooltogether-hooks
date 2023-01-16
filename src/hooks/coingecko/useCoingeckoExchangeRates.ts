import { useQuery } from 'react-query'

import { COINGECKO_API_URL, NO_REFETCH, QUERY_KEYS } from '../../constants'

export const useCoingeckoExchangeRates = async () => {
  return useQuery(
    [QUERY_KEYS.getCoingeckoExchangeRates],
    async () => await getCoingeckoExchangeRates(),
    {
      staleTime: Infinity,
      enabled: true,
      ...NO_REFETCH
    }
  )
}

const getCoingeckoExchangeRates = async () => {
  try {
    const url = new URL(`${COINGECKO_API_URL}/exchange_rates`)
    const response = await fetch(url.toString())
    const exchangeRates = (await response.json()).rates

    return exchangeRates
  } catch (e) {
    console.error(e.message)
    return undefined
  }
}