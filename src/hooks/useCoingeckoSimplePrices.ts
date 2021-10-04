import { useQuery } from 'react-query'

import { COINGECKO_API_URL, QUERY_KEYS } from '../constants'

export const SIMPLE_PRICES_CHAIN_ID_MAP = {
  1: 'ethereum',
  4: 'ethereum',
  137: 'matic-network',
  80001: 'matic-network'
}

export const useCoingeckoSimplePrices = () => {
  return useQuery(
    [QUERY_KEYS.getCoingeckoTokenPrices],
    async () => await getCoingeckoSimplePrices(),
    {
      staleTime: Infinity,
      enabled: true,
      refetchInterval: false,
      refetchOnMount: false,
      refetchOnReconnect: false,
      refetchIntervalInBackground: false,
      refetchOnWindowFocus: false
    }
  )
}

const getCoingeckoSimplePrices = async () => {
  try {
    const url = new URL(`${COINGECKO_API_URL}/simple/price`)
    url.searchParams.set('ids', ['ethereum', 'matic-network'].join(','))
    url.searchParams.set('vs_currencies', 'usd')
    const response = await fetch(url.toString())
    const tokenPrices = await response.json()
    return tokenPrices
  } catch (e) {
    console.error(e.message)
    return undefined
  }
}
