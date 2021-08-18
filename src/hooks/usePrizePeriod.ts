import { useQuery } from 'react-query'
import { BaseProvider } from '@ethersproject/providers'
import { batch, contract } from '@pooltogether/etherplex'
import { useState } from 'react'
import { BigNumber } from 'ethers'
import { getSecondsRemainingInPrizePeriod, sToMs } from '@pooltogether/utilities'

import { QUERY_KEYS } from '../constants'
import useReadProvider from './useReadProvider'
import useRefetchInterval from './useRefetchInterval'
import PrizeStrategyAbi_3_4_4 from '../abis/PrizeStrategy_3_4_4'

/**
 * A hook that fetches returns metadata about a prize period.
 * Dynamically changes the refresh rate depending on how much time is left in the prize period.
 * Refreshes faster once the prize period is over so that we fetch the next prize periods data faster.
 * @param chainId
 * @param prizeStrategyAddress
 * @returns
 */
export const usePrizePeriod = (chainId: number, prizeStrategyAddress: string) => {
  const standardRefetchIntervalInMs = useRefetchInterval()
  const { readProvider, isReadProviderReady } = useReadProvider(chainId)
  const [refetchInterval, setRefetchInterval] = useState<number | false>(false)

  const enabled = isReadProviderReady && Boolean(prizeStrategyAddress) && Boolean(chainId)

  // Fetch prize period data from chain
  return useQuery(
    [QUERY_KEYS.prizePeriod, chainId, prizeStrategyAddress],
    () => getPrizePeriod(readProvider, prizeStrategyAddress),
    {
      enabled,
      refetchInterval,
      refetchOnWindowFocus: false,
      onSuccess: (data) =>
        onPrizePeriodFetchSuccess(
          data,
          setRefetchInterval,
          standardRefetchIntervalInMs,
          refetchInterval
        )
    }
  )
}

interface PrizePeriodResponse {
  canCompleteAward: boolean
  canStartAward: boolean
  currentPrize: BigNumber
  isRngCompleted: boolean
  isRngRequested: boolean
  prizePeriodSeconds: BigNumber
  prizePeriodStartedAt: BigNumber
  prizePeriodEndAt: BigNumber
}

/**
 * Fetches the live prize period data from the chain
 * @param provider
 * @param prizeStrategyAddress
 * @returns
 */
const getPrizePeriod = async (
  provider: BaseProvider,
  prizeStrategyAddress: string
): Promise<PrizePeriodResponse> => {
  const prizeStrategyContract = contract(
    prizeStrategyAddress,
    PrizeStrategyAbi_3_4_4,
    prizeStrategyAddress
  )

  const response = await batch(
    provider,
    prizeStrategyContract
      .canCompleteAward()
      .canStartAward()
      .currentPrize()
      .isRngCompleted()
      .isRngRequested()
      .prizePeriodSeconds()
      .prizePeriodStartedAt()
      .prizePeriodEndAt()
  )

  return {
    canCompleteAward: response[prizeStrategyAddress].canCompleteAward[0],
    canStartAward: response[prizeStrategyAddress].canStartAward[0],
    currentPrize: response[prizeStrategyAddress].currentPrize[0],
    isRngCompleted: response[prizeStrategyAddress].isRngCompleted[0],
    isRngRequested: response[prizeStrategyAddress].isRngRequested[0],
    prizePeriodSeconds: response[prizeStrategyAddress].prizePeriodSeconds[0],
    prizePeriodStartedAt: response[prizeStrategyAddress].prizePeriodStartedAt[0],
    prizePeriodEndAt: response[prizeStrategyAddress].prizePeriodEndAt[0]
  }
}

/**
 * After the data has been fetched, set the refetch interval depending on
 * how long there is until the next prize period.
 * @param data
 * @param setRefetchInterval
 * @param standardRefetchIntervalInMs
 * @param refetchInterval
 */
const onPrizePeriodFetchSuccess = async (
  data: PrizePeriodResponse,
  setRefetchInterval: React.Dispatch<React.SetStateAction<number | false>>,
  standardRefetchIntervalInMs: number,
  refetchInterval: number | false
) => {
  const secondsLeft = getSecondsRemainingInPrizePeriod(
    data.prizePeriodSeconds,
    data.prizePeriodStartedAt
  )

  if (secondsLeft > 60) {
    // Refetch 1 block - 1 second before prize will be awarded.
    // The 2nd refetch will be 1 second after the last block in the prize period.
    setRefetchInterval(sToMs(secondsLeft + 1) - standardRefetchIntervalInMs)
  } else if (standardRefetchIntervalInMs !== refetchInterval) {
    // Set to the standard refetch interval for that chain
    setRefetchInterval(standardRefetchIntervalInMs)
  }
}
