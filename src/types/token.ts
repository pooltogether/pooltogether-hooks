import { ethers } from 'ethers'

export interface Token {
  address: string
  symbol: string
  name: string
  decimals: string
}

export interface TokenBalance extends Token {
  hasBalance: boolean
  amount: string
  amountUnformatted: ethers.BigNumber
  amountPretty: string
  totalSupply: string
  totalSupplyUnformatted: ethers.BigNumber
  totalSupplyPretty: string
}

export interface TokenBalanceWithUsd extends TokenBalance, TokenPrice {}

export interface TokenBalances {
  [address: string]: TokenBalance
}

export interface TokenPrices {
  [address: string]: TokenPrice
}

export interface TokenPrice {
  usd: number
}
