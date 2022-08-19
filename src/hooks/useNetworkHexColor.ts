import { NETWORK } from '@pooltogether/utilities'

const DEFAULT_HEX_COLOR = '#023'

// Returns a hex color string based on a network's chainId
export const useNetworkHexColor = (chainId: number) => {
  return NETWORK_MAPPING[chainId] || DEFAULT_HEX_COLOR
}

export const NETWORK_MAPPING = Object.freeze({
  [NETWORK.mainnet]: '#4b78ff',
  [NETWORK.rinkeby]: '#e09e0a',
  [NETWORK.goerli]: '#299cf0',
  [NETWORK.kovan]: '#6e1afb',
  [NETWORK.ropsten]: '#d11a48',
  [NETWORK.polygon]: '#7A53DE',
  [NETWORK.mumbai]: '#5b4397',
  [NETWORK.avalanche]: '#e5382e',
  [NETWORK.fuji]: '#b64116',
  [NETWORK.optimism]: '#e61b1b',
  [NETWORK['optimism-kovan']]: '#c60000'
})
