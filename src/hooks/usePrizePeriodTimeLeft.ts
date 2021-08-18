import { BigNumber } from '@ethersproject/bignumber'
import { getSecondsRemainingInPrizePeriod } from '@pooltogether/utilities'
import { useMemo } from 'react'

import { useTimeCountdown } from './useTimeCountdown'

/**
 * calculates the time remaining in the prize period and hands it off to the useTimeCountdown hook
 * @param {number} prizePeriodSeconds the duration of the time period in seconds
 * @param {number} prizePeriodStartedAt the unix timestamp when the period started
 * @returns {object} time representation broken down into days, hours, minutes, seconds and secondsLeft (remaining)
 */
export const usePrizePeriodTimeLeft = (
  prizePeriodSeconds: BigNumber,
  prizePeriodStartedAt: BigNumber
) => {
  const initialSecondsLeft = useMemo(() => {
    return getSecondsRemainingInPrizePeriod(prizePeriodSeconds, prizePeriodStartedAt)
  }, [prizePeriodSeconds, prizePeriodStartedAt])

  return useTimeCountdown(initialSecondsLeft)
}
