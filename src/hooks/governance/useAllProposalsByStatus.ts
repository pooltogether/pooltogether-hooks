import { useMemo } from 'react'

import { ProposalStatus } from '../../constants'
import { Proposal, useAllProposals } from './useAllProposals'

export function useAllProposalsByStatus() {
  const { data: proposals, isFetched, error, ...useQueryResults } = useAllProposals()

  const data: {
    [ProposalStatus.pending]: Proposal[]
    [ProposalStatus.active]: Proposal[]
    [ProposalStatus.cancelled]: Proposal[]
    [ProposalStatus.defeated]: Proposal[]
    [ProposalStatus.succeeded]: Proposal[]
    [ProposalStatus.queued]: Proposal[]
    [ProposalStatus.expired]: Proposal[]
    [ProposalStatus.executed]: Proposal[]
  } = useMemo(() => {
    const sortedProposals = {
      [ProposalStatus.pending]: [],
      [ProposalStatus.active]: [],
      [ProposalStatus.cancelled]: [],
      [ProposalStatus.defeated]: [],
      [ProposalStatus.succeeded]: [],
      [ProposalStatus.queued]: [],
      [ProposalStatus.expired]: [],
      [ProposalStatus.executed]: []
    }
    if (!proposals || !isFetched || error) return null

    Object.values(proposals).forEach((proposal) => {
      sortedProposals[proposal.status].push(proposal)
    })

    return sortedProposals
  }, [proposals, isFetched, error])

  return {
    ...useQueryResults,
    isFetched,
    error,
    data
  }
}
