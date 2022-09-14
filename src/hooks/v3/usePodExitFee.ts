import { Provider } from '@ethersproject/abstract-provider'
import { batch, contract } from '@pooltogether/etherplex'
import { getReadProvider } from '@pooltogether/wallet-connection'
import { BigNumber } from 'ethers'
import { useQuery } from 'react-query'
import { ERC20Abi } from '../../abis/ERC20Abi'
import { PodAbi } from '../../abis/PodAbi'
import { getAmountFromBigNumber } from '../../utils/getAmountFromBigNumber'

export const usePodExitFee = (
  chainId: number,
  podAddress: string,
  underlyingTokenAddress: string,
  amountToWithdrawUnformatted: BigNumber,
  decimals: string
) => {
  const provider = getReadProvider(chainId)

  return useQuery(
    ['usePodExitFee', chainId, podAddress, amountToWithdrawUnformatted?.toString()],
    () =>
      getPodExitFee(
        provider,
        podAddress,
        underlyingTokenAddress,
        amountToWithdrawUnformatted,
        decimals
      ),
    { enabled: Boolean(amountToWithdrawUnformatted) }
  )
}

const getPodExitFee = async (
  provider: Provider,
  podAddress: string,
  underlyingTokenAddress: string,
  amountToWithdrawUnformatted: BigNumber,
  decimals: string
) => {
  const batchCalls = []
  const podContract = contract(podAddress, PodAbi, podAddress)
  const underlyingTokenContract = contract(underlyingTokenAddress, ERC20Abi, underlyingTokenAddress)

  batchCalls.push(
    podContract.getEarlyExitFee(amountToWithdrawUnformatted),
    underlyingTokenContract.balanceOf(podAddress)
  )

  const response = await batch(provider, ...batchCalls)

  const float = getAmountFromBigNumber(response[underlyingTokenAddress].balanceOf[0], decimals)
  const exitFee = getAmountFromBigNumber(response[podAddress].getEarlyExitFee[0], decimals)

  return { decimals, float, exitFee }
}
