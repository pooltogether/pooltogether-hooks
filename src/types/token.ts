import { BigNumber } from 'ethers'

// TODO: A token should have `chainId: number` to help uniquely identify it
export interface Token {
  address: string
  symbol: string
  name: string
  decimals: string
}

export interface Amount {
  amount: string
  amountUnformatted: BigNumber
  amountPretty: string
}

export interface TokenBalance extends Amount {
  hasBalance: boolean
}

export interface TokenWithBalance extends Token, TokenBalance {}

export interface TokenWithUsdBalance extends TokenWithBalance {
  usdPerToken: number
  balanceUsd: Amount
  balanceUsdScaled: BigNumber
}

export interface TokenWithAllBalances extends TokenWithBalance {
  totalSupply: string
  totalSupplyUnformatted: BigNumber
  totalSupplyPretty: string
}

export interface TokenBalances {
  [address: string]: TokenWithAllBalances
}

export interface TokenPrice {
  usd: number
}
