import { GOVERNANCE_CONTRACT_ADDRESSES } from '../constants'
import { useGovernanceChainId } from './useGovernanceChainId'
import { useClaimableTokenFromTokenFaucets } from './useClaimableTokenFromTokenFaucets'
import { useRetroactivePoolClaimData } from './useRetroactivePoolClaimData'

import { NETWORK } from '@pooltogether/utilities'

// Hard-coded to 1 for mainnet as $POOL is only on mainnet
export const useTotalClaimablePool = (address) => {
  const {
    error: claimableFromTokenFaucetsError,
    data: claimableFromTokenFaucets,
    isFetched: claimableFromTokenFaucetIsFetched
  } = useClaimableTokenFromTokenFaucets(NETWORK.mainnet, address)

  const poolTokenChainId = useGovernanceChainId()

  if (claimableFromTokenFaucetsError) {
    console.error(claimableFromTokenFaucetsError)
  }

  const {
    error: retroPoolClaimError,
    data: retroPoolClaimData,
    isFetched: retroPoolClaimDataIsFetched
  } = useRetroactivePoolClaimData(address)

  if (retroPoolClaimError) {
    console.error(retroPoolClaimError)
  }

  const isFetched = claimableFromTokenFaucetIsFetched && retroPoolClaimDataIsFetched

  const poolTokenAddress = GOVERNANCE_CONTRACT_ADDRESSES[poolTokenChainId].GovernanceToken.toLowerCase()

  let total
  if (isFetched) {
    total = Number(claimableFromTokenFaucets?.totals?.[poolTokenAddress]?.totalClaimableAmount) || 0

    if (retroPoolClaimData?.formattedAmount && !retroPoolClaimData.isClaimed) {
      total += retroPoolClaimData.formattedAmount
    }
  }

  return {
    isFetched,
    total
  }
}
