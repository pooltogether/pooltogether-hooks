import { useQuery } from 'react-query'
import { batch, contract } from '@pooltogether/etherplex'
import { ethers } from 'ethers'
import { isAddress } from '@ethersproject/address'
import { QUERY_KEYS } from '../../constants'
import { useGovernanceChainId } from './useGovernanceChainId'
import { MerkleDistributorAbi } from '../../abis/MerkleDistributor'
import { GOVERNANCE_CONTRACT_ADDRESSES } from '@pooltogether/utilities'
import { getReadProvider } from '@pooltogether/wallet-connection'

export const useRetroactivePoolClaimData = (address) => {
  const { refetch, data, isFetching, isFetched, error } = useFetchRetroactivePoolClaimData(address)

  return {
    loading: !isFetched,
    refetch,
    data,
    isFetching,
    isFetched,
    error
  }
}

const useFetchRetroactivePoolClaimData = (usersAddress) => {
  const chainId = useGovernanceChainId()
  const readProvider = getReadProvider(chainId)

  return useQuery(
    [QUERY_KEYS.retroactivePoolClaimDataQuery, usersAddress, chainId],
    async () => {
      return getRetroactivePoolClaimData(readProvider, chainId, usersAddress)
    },
    {
      enabled: Boolean(usersAddress) && isAddress(usersAddress),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      refetchOnMount: false
    }
  )
}

const getRetroactivePoolClaimData = async (provider, chainId, usersAddress) => {
  const checksummedAddress = ethers.utils.getAddress(usersAddress)
  let merkleDistributionData: any = {}

  try {
    merkleDistributionData = await getMerkleDistributionData(checksummedAddress, chainId)
  } catch (e) {
    return {
      isMissing: true,
      isClaimed: false,
      amount: ethers.BigNumber.from(0),
      formattedAmount: 0
    }
  }

  const amount = ethers.BigNumber.from(merkleDistributionData.amount).toString()
  const formattedAmount = Number(ethers.utils.formatUnits(amount, 18))
  const isClaimed = await getIsClaimed(provider, chainId, merkleDistributionData.index)

  return {
    ...merkleDistributionData,
    amount,
    formattedAmount,
    isClaimed
  }
}

const getMerkleDistributionData = async (usersAddress, chainId) => {
  const response = await fetch(
    `https://merkle.pooltogether.com/.netlify/functions/merkleAddressData?address=${usersAddress}${
      chainId === 4 ? '&chainId=4&testVersion=v4' : ''
    }`
  )

  if (response.status === 200) {
    return await response.json()
  } else {
    throw new Error('User does not exist in Merkle tree or 500 error')
  }
}

const getIsClaimed = async (provider, chainId, index) => {
  const merkleDistributorContract = contract(
    'merkleDistributor',
    MerkleDistributorAbi,
    GOVERNANCE_CONTRACT_ADDRESSES[chainId].MerkleDistributor
  )
  const { merkleDistributor } = await batch(provider, merkleDistributorContract.isClaimed(index))

  return merkleDistributor.isClaimed[0]
}
