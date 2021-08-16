import { CookieAttributes } from 'js-cookie'

export const SELECTED_WALLET_COOKIE_KEY = 'selectedWallet'

export const QUERY_KEYS = Object.freeze({
  prizePeriod: 'prizePeriod',
  tokenBalances: 'tokenBalances',
  tokenAllowances: 'tokenAllowances',
  readProvider: 'readProvider',
  readProviders: 'readProviders',
  getCoingeckoTokenData: 'getCoingeckoTokenData'
})

export const NO_REFETCH_QUERY_OPTIONS: {
  refetchInterval: false
  refetchOnReconnect: false
  refetchOnWindowFocus: false
  staleTime: number
} = Object.freeze({
  refetchInterval: false,
  refetchOnReconnect: false,
  refetchOnWindowFocus: false,
  staleTime: Infinity
})
