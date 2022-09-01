import { useQuery } from 'react-query'
import { ethers } from 'ethers'
import { batch, contract } from '@pooltogether/etherplex'

import { GOVERNANCE_CONTRACT_ADDRESSES, QUERY_KEYS } from '../constants'
import { useGovernanceChainId } from './useGovernanceChainId'
import { useReadProvider } from './useReadProvider'
import { DelegateableERC20Abi } from '../abis/DelegateableERC20Abi'

export const usePoolTokenData = (usersAddress, addressOverride, chainId = null) => {
  chainId = useGovernanceChainId()

  const readProvider = useReadProvider(chainId)

  const address = addressOverride || usersAddress

  return useQuery(
    [QUERY_KEYS.poolTokenDataQuery, chainId, address],
    async () => {
      return getPoolTokenData(readProvider, chainId, address)
    },
    {
      enabled: Boolean(chainId && address)
    }
  )
}

const getPoolTokenData = async (provider, chainId, usersAddress) => {
  const poolAddress = GOVERNANCE_CONTRACT_ADDRESSES[chainId].GovernanceToken
  const poolContract = contract('pool', DelegateableERC20Abi, poolAddress)

  try {
    const poolChainData = await batch(
      provider,
      poolContract
        .balanceOf(usersAddress)
        .decimals()
        .totalSupply()
    )

    const totalSupplyBN = poolChainData.pool.totalSupply[0]
    const usersBalanceBN = poolChainData.pool.balanceOf[0]
    const decimals = poolChainData.pool.decimals[0]

    return {
      ...poolChainData.pool,
      usersBalanceBN,
      usersBalance: Number(ethers.utils.formatUnits(usersBalanceBN, decimals)),
      decimals,
      totalSupplyBN,
      totalSupply: Number(ethers.utils.formatUnits(totalSupplyBN, decimals))
    }
  } catch (error) {
    console.error(error.message)
    return {}
  }
}
