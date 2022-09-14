import gql from 'graphql-tag'
import { request } from 'graphql-request'
import { useQuery } from 'react-query'
import { batch, contract } from '@pooltogether/etherplex'
import { GovernorAlphaAbi } from '../../abis/GovernorAlphaABI'
import { NO_REFETCH, PROPOSAL_STATES, ProposalStatus } from '../../constants'
import { NETWORK } from '@pooltogether/utilities'
import { getReadProvider } from '@pooltogether/wallet-connection'

export interface Proposal {
  id: string
  title: string
  description: string
  againstVotes: number
  forVotes: number
  totalVotes: number
  status: ProposalStatus
}

const GOVERNOR_ALPHA = '0xB3a87172F555ae2a2AB79Be60B336D2F7D0187f0'
const GOVERNANCE_SUBGRAPH =
  'https://api.thegraph.com/subgraphs/name/pooltogether/pooltogether-governance'

export function useAllProposals() {
  return useQuery(
    ['useAllProposals', NETWORK.mainnet],
    async () => {
      return getProposals()
    },
    {
      ...NO_REFETCH
    }
  )
}

async function getProposals() {
  const chainId = NETWORK.mainnet
  const provider = getReadProvider(chainId)
  const query = proposalsQuery()
  const proposals: { [id: string]: Proposal } = {}

  const subgraphData = await request(GOVERNANCE_SUBGRAPH, query)

  const batchCalls = []
  subgraphData.proposals.forEach((proposal) => {
    const governanceContract = contract(proposal.id, GovernorAlphaAbi, GOVERNOR_ALPHA)
    batchCalls.push(governanceContract.proposals(proposal.id))
    batchCalls.push(governanceContract.state(proposal.id))
  })

  const proposalChainData = await batch(provider, ...batchCalls)

  subgraphData.proposals.forEach((proposal) => {
    const { id, description } = proposal

    proposals[id] = {
      id,
      title: description?.split(/# |\n/g)[1] || 'Untitled',
      description: description || 'No description.',
      againstVotes: proposalChainData[id].proposals.againstVotes,
      forVotes: proposalChainData[id].proposals.forVotes,
      totalVotes: proposalChainData[id].proposals.forVotes.add(
        proposalChainData[id].proposals.againstVotes
      ),
      status: PROPOSAL_STATES[proposalChainData[id].state[0]]
    }
  })

  return proposals
}

const proposalsQuery = () => {
  return gql`
    query proposalsQuery {
      proposals {
        id
        proposer {
          id
          delegatedVotesRaw
          delegatedVotes
          tokenHoldersRepresentedAmount
        }
        targets
        values
        signatures
        calldatas
        startBlock
        endBlock
        description
        status
        executionETA
      }
    }
  `
}
