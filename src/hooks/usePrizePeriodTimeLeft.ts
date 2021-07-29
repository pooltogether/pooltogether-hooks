import { getSecondsSinceEpoch } from '@pooltogether/utilities'

import { useTimeCountdown } from './useTimeCountdown'

export const usePrizePeriodTimeLeft = (prizePeriodSeconds, prizePeriodStartedAt) => {
  console.log(prizePeriodSeconds)
  console.log(prizePeriodStartedAt)
  const prizePeriodDurationInSeconds = prizePeriodSeconds.toNumber()
  const prizePeriodStartedAtInSeconds = prizePeriodStartedAt.toNumber()
  const currentTimeInSeconds = getSecondsSinceEpoch()

  const secondsSinceStartOfPrizePeriod = currentTimeInSeconds - prizePeriodStartedAtInSeconds
  const initialSecondsLeft = prizePeriodDurationInSeconds - secondsSinceStartOfPrizePeriod

  return useTimeCountdown(initialSecondsLeft)
}
