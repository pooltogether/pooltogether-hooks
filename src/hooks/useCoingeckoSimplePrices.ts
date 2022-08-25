import { useQuery } from 'react-query'

import { COINGECKO_API_URL, QUERY_KEYS } from '../constants'

export const SIMPLE_PRICES_CHAIN_ID_MAP = {
  1: 'ethereum',
  4: 'ethereum',
  5: 'ethereum',
  137: 'matic-network',
  80001: 'matic-network',
  42220: 'celo',
  44787: 'celo',
  56: 'binancecoin',
  97: 'binancecoin',
  43113: 'avalanche-2',
  43114: 'avalanche-2',
  420: 'ethereum',
  10: 'ethereum',
  42161: 'ethereum',
  421613: 'ethereum',
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
    const ids = Array.from(new Set(Object.values(SIMPLE_PRICES_CHAIN_ID_MAP)))
    url.searchParams.set('ids', ids.join(','))
    url.searchParams.set('vs_currencies', 'usd')
    const response = await fetch(url.toString())
    const tokenPrices = await response.json()

    return tokenPrices
  } catch (e) {
    console.error(e.message)
    return undefined
  }
}
