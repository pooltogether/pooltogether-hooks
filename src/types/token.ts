import { ethers } from 'ethers'

export interface Token {
  address: string
  symbol: string
  name: string
  decimals: string
}

export interface Amount {
  amount: string
  amountUnformatted: ethers.BigNumber
  amountPretty: string
}

export interface TokenBalance extends Amount {
  hasBalance: boolean
}

export interface TokenWithBalance extends Token, TokenBalance {}

export interface TokenWithAllBalances extends TokenWithBalance {
  totalSupply: string
  totalSupplyUnformatted: ethers.BigNumber
  totalSupplyPretty: string
}

export interface TokenBalances {
  [address: string]: TokenWithAllBalances
}

export interface TokenPrices {
  [address: string]: TokenPrice
}

export interface TokenPrice {
  usd: number
}
