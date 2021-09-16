import { ethers } from 'ethers'

export interface Token {
  address: string
  symbol: string
  name: string
  decimals: string
}

export interface TokenBalance {
  hasBalance: boolean
  amount: string
  amountUnformatted: ethers.BigNumber
  amountPretty: string
}

export interface TokenWithBalances extends Token, TokenBalance {
  totalSupply: string
  totalSupplyUnformatted: ethers.BigNumber
  totalSupplyPretty: string
}

export interface TokenBalanceWithUsd extends TokenWithBalances, TokenPrice {}

export interface TokenBalances {
  [address: string]: TokenWithBalances
}

export interface TokenPrices {
  [address: string]: TokenPrice
}

export interface TokenPrice {
  usd: number
}
