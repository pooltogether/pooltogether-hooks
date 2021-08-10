import { getSecondsSinceEpoch } from '@pooltogether/utilities'

import { useTimeCountdown } from './useTimeCountdown'

/**
 * calculates the time remaining in the prize period and hands it off to the useTimeCountdown hook
 * @param {number} prizePeriodSeconds the duration of the time period in seconds
 * @param {number} prizePeriodStartedAt the unix timestamp when the period started
 * @returns {object} time representation broken down into days, hours, minutes, seconds and secondsLeft (remaining)
 */
export const usePrizePeriodTimeLeft = (prizePeriodSeconds, prizePeriodStartedAt) => {
  const prizePeriodDurationInSeconds = prizePeriodSeconds.toNumber()
  const prizePeriodStartedAtInSeconds = prizePeriodStartedAt.toNumber()
  const currentTimeInSeconds = getSecondsSinceEpoch()

  const secondsSinceStartOfPrizePeriod = currentTimeInSeconds - prizePeriodStartedAtInSeconds
  const initialSecondsLeft = prizePeriodDurationInSeconds - secondsSinceStartOfPrizePeriod

  return useTimeCountdown(initialSecondsLeft)
}
