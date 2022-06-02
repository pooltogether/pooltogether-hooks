import { NETWORK } from '@pooltogether/utilities'

const DEFAULT_HEX_COLOR = '#023'

// Returns a hex color string based on a network's chainId
export const useNetworkHexColor = (chainId: number) => {
  return NETWORK_MAPPING[chainId] || DEFAULT_HEX_COLOR
}

export const NETWORK_MAPPING = Object.freeze({
  [NETWORK.mainnet]: '#6182E4',
  [NETWORK.rinkeby]: '#F2C35A',
  [NETWORK.goerli]: '#419AEC',
  [NETWORK.kovan]: '#886DF7',
  [NETWORK.ropsten]: '#F25C8C',
  [NETWORK.polygon]: '#7A53DE',
  [NETWORK.mumbai]: '#9A73FE',
  [NETWORK.avalanche]: '#DE4F47',
  [NETWORK.fuji]: '#FE6F67'
})
