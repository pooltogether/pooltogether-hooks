import { PRIZE_POOL_CONTRACTS } from '../constants'
import { useEnvChainIds } from './useEnvChainIds'

export function useAllPoolContracts() {
  const governanceContracts = useGovernancePoolContracts()
  return [...Object.values(governanceContracts)].flat()
}

export function useGovernancePoolContracts() {
  const chainIds = useEnvChainIds()
  return chainIds.reduce((contracts, chainId) => {
    contracts[chainId] = PRIZE_POOL_CONTRACTS[chainId].governance
    return contracts
  }, {})
}

export function usePoolContractByAddress(poolAddress) {
  const poolContracts = useAllPoolContracts()
  if (!poolAddress) return null
  return poolContracts.find((contract) => contract.prizePool.address === poolAddress)
}

export function usePoolContractBySymbol(symbol) {
  const poolContracts = useAllPoolContracts()
  if (!symbol) return null
  return poolContracts.find((contract) => contract.symbol === symbol)
}
