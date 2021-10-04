import { chainIdToNetworkName, deserializeBigNumbers } from '@pooltogether/utilities'

import { fetchData } from './fetchData'

const API_URI = process.env.NEXT_JS_API_URI

// Select only the pools from the API that we want the Flagship to show
const flagshipFilteredPoolAddresses = {
  1: [
    '0xebfb47a7ad0fd6e57323c8a42b2e5a6a4f68fc1a',
    '0x0650d780292142835f6ac58dd8e2a336e87b4393',
    '0xde9ec95d7708b8319ccca4b8bc92c0a3b70bf416',
    '0x396b4489da692788e327e2e4b2b0459a5ef26791',
    '0xbc82221e131c082336cf698f0ca3ebd18afd4ce7',
    '0xc32a0f9dfe2d93e8a60ba0200e033a59aec91559',
    '0x65c8827229fbd63f9de9fdfd400c9d264066a336',
    '0xeab695a8f5a44f583003a8bc97d677880d528248',
    '0xc2a7dfb76e93d12a1bb1fa151b9900158090395d'
  ],
  4: ['0x4706856fa8bb747d50b4ef8547fe51ab5edc4ac2', '0xab068f220e10eed899b54f1113de7e354c9a8eb7'],
  56: ['0x06d75eb5ca4da7f7c7a043714172cf109d07a5f8', '0x2f4fc07e4bd097c68774e5bdaba98d948219f827'],
  137: ['0x887e17d791dcb44bfdda3023d26f7a04ca9c7ef4', '0xee06abe9e2af61cabcb13170e01266af2defa946'],
  42220: [
    '0x6f634f531ed0043b94527f68ec7861b4b1ab110d',
    '0xbe55435BdA8f0A2A20D2Ce98cC21B0AF5bfB7c83'
  ]
}

/**
 * Fetches the data for a single pool and converts big number data to BigNumbers
 * @param {*} chainId
 * @param {*} poolAddress
 * @returns
 */
export const getPool = async (chainId, poolAddress) =>
  await fetchData(`${API_URI}/pools/${chainId}/${poolAddress}.json`).then((pool) =>
    formatPool(pool, chainId)
  )

/**
 * Fetches the data for all pools and converts big number data to BigNumbers
 * @param {*} chainIds
 * @returns
 */
export const getPoolsByChainIds = async (chainIds) =>
  Promise.all(chainIds.map(async (chainId) => getPoolsByChainId(chainId))).then(keyPoolsByChainId)

/**
 * Fetches the data for all pools and converts big number data to BigNumbers
 * @param {*} chainId
 * @returns
 */
export const getPoolsByChainId = async (chainId) =>
  await fetchData(`${API_URI}/pools/${chainId}.json`).then((pools) =>
    pools
      ?.filter((pool) => {
        const poolAddress = pool.prizePool.address.toLowerCase()
        const chainFilterAddresses = flagshipFilteredPoolAddresses[chainId]
        const filterAddresses = chainFilterAddresses.map((address) => address.toLowerCase())
        return filterAddresses.includes(poolAddress)
      })
      .map((pool) => formatPool(pool, chainId))
  )

/**
 * Adds chain id and converts big numbers into BigNumbers
 * @param {*} pool
 * @param {*} chainId
 * @returns
 */
const formatPool = (pool, chainId) => ({
  chainId,
  networkName: chainIdToNetworkName(chainId),
  ...deserializeBigNumbers(pool)
})

/**
 * Keys the lists of pools by their chain id
 * @param {*} allPools
 * @returns
 */
const keyPoolsByChainId = (allPools) => {
  const arrayOfArrayOfPools = Object.values(allPools)
  return arrayOfArrayOfPools.reduce((sortedPools, pools) => {
    const chainId = pools?.[0].chainId
    if (chainId) {
      sortedPools[chainId] = pools
    }
    return sortedPools
  }, {})
}
