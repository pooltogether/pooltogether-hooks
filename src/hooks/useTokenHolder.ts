import { useQuery } from 'react-query'
import gql from 'graphql-tag'
import { request } from 'graphql-request'

import { QUERY_KEYS } from '../constants'
import { useBlockOnProviderLoad } from './useBlockOnProviderLoad'
import { useGovernanceChainId } from './useGovernanceChainId'
import { useGovernanceGraphUri } from './useGovernanceGraphUri'
import { isAddress } from 'ethers/lib/utils'

const EMPTY_TOKEN_HOLDER = Object.freeze({
  delegatedVotes: null,
  tokenHoldersRepresentedAmount: null,
  delegate: null,
  tokenBalance: '0',
  isDelegating: false,
  isSelfDelegated: false,
  hasBalance: false,
  canVote: false
})

export function useTokenHolder(address, blockNumber) {
  const block: any = useBlockOnProviderLoad()

  // Only add filter if it is in the past
  const isDataFromBeforeCurrentBlock = block && blockNumber && blockNumber < block.blockNumber

  const blockNumberToQuery = isDataFromBeforeCurrentBlock ? blockNumber : undefined
  const { refetch, data, isFetching, isFetched, error } = useFetchTokenHolder(
    address,
    blockNumberToQuery
  )

  if (error) {
    console.error(error)
  }

  return {
    isDataFromBeforeCurrentBlock,
    refetch,
    data,
    isFetching,
    isFetched,
    error
  }
}

function useFetchTokenHolder(address, blockNumber) {
  const chainId = useGovernanceChainId()
  const governanceGraphUri = useGovernanceGraphUri(chainId)

  return useQuery(
    [QUERY_KEYS.tokenHolderQuery, chainId, address, blockNumber],
    async () => {
      return getTokenHolder(address, chainId, blockNumber, governanceGraphUri)
    },
    {
      enabled: Boolean(chainId && address) && isAddress(address)
    }
  )
}

async function getTokenHolder(address, chainId, blockNumber, governanceGraphUri) {
  try {
    const query = tokenHolderQuery(blockNumber)
    const variables = { id: address.toLowerCase() }
    const subgraphData = await request(governanceGraphUri, query, variables)

    if (!subgraphData.tokenHolder && !subgraphData.delegate) {
      return EMPTY_TOKEN_HOLDER
    }

    const isDelegating = Boolean(subgraphData?.tokenHolder?.delegate?.id)
    const isSelfDelegated =
      address.toLowerCase() === subgraphData?.tokenHolder?.delegate?.id?.toLowerCase()
    const hasBalance = Number(subgraphData?.tokenHolder?.tokenBalance) > 0
    const canVote = Number(subgraphData?.delegate?.delegatedVotes || 0) > 0
    const tokenBalance = subgraphData?.tokenHolder?.tokenBalance || '0'
    const isBeingDelegatedTo =
      subgraphData?.delegate?.tokenHoldersRepresentedAmount >= 2 ||
      (subgraphData?.delegate?.tokenHoldersRepresentedAmount === 1 &&
        subgraphData?.delegate?.delegatedVotes !== tokenBalance)
    const tokenHoldersRepresentedAmount = isSelfDelegated
      ? String(Number(subgraphData?.delegate?.tokenHoldersRepresentedAmount) - 1)
      : subgraphData?.delegate?.tokenHoldersRepresentedAmount

    return {
      ...subgraphData.delegate,
      ...subgraphData.tokenHolder,
      tokenHoldersRepresentedAmount,
      tokenBalance,
      isBeingDelegatedTo,
      isDelegating,
      isSelfDelegated,
      hasBalance,
      canVote
    }
  } catch (error) {
    console.error(JSON.stringify(error, undefined, 2))
    return EMPTY_TOKEN_HOLDER
  }
}

const tokenHolderQuery = (blockNumber) => {
  const blockFilter = blockNumber ? `, block: { number: ${blockNumber} }` : ''

  return gql`
    query tokenHolderQuery($id: String!) {
      tokenHolder(id: $id ${blockFilter}) {
        delegate {
          id
          delegatedVotes
          tokenHoldersRepresentedAmount
        }
        tokenBalance
      }
      delegate(id: $id ${blockFilter}) {
        delegatedVotes
        tokenHoldersRepresentedAmount
      }
    }
  `
}
