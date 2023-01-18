export interface CoingeckoExchangeRates {
  [id: string]: {
    name: string
    unit: string
    value: number
    type: 'crypto' | 'fiat' | 'commodity'
  }
}
