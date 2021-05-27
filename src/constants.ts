import { CookieAttributes } from 'js-cookie'

export const SELECTED_WALLET_COOKIE_KEY = 'selectedWallet'

export const COOKIE_OPTIONS: CookieAttributes = Object.freeze({
  sameSite: 'strict',
  secure: process.env.NEXT_JS_DOMAIN_NAME === 'pooltogether.com',
  domain: process.env.NEXT_JS_DOMAIN_NAME && `.${process.env.NEXT_JS_DOMAIN_NAME}`
})

export const QUERY_KEYS = Object.freeze({
  tokenBalances: 'tokenBalances',
  tokenAllowances: 'tokenAllowances',
  readProvider: 'readProvider'
})
