import { useEffect, useState } from 'react'
import useInterval from 'beautiful-react-hooks/useInterval'
import { getTimeBreakdown, msToSeconds } from '@pooltogether/utilities'

/**
 * Compares the range of time now with the time provided and provides a nice data representation to build UIs with
 * @param {number} initialSecondsLeft how many seconds remain in the period
 * @param {number} countBy Optional param for how often this function should run (default to every second)
 * @returns {object} time representation broken down into days, hours, minutes, seconds and secondsLeft (remaining)
 */
export const useTimeCountdown = (initialSecondsLeft: number, countBy = 1000) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSecondsLeft < 0 ? 0 : initialSecondsLeft)

  useInterval(() => {
    const secondsToCountBy = msToSeconds(countBy)
    const newRemainder = secondsLeft - secondsToCountBy
    if (newRemainder >= 0) {
      setSecondsLeft(newRemainder)
    }
  }, countBy)

  useEffect(() => {
    const newInitialSecondsLeft = initialSecondsLeft < 0 ? 0 : initialSecondsLeft
    if (newInitialSecondsLeft !== secondsLeft) {
      setSecondsLeft(newInitialSecondsLeft)
    }
  }, [initialSecondsLeft])

  const timeBreakdown = getTimeBreakdown(secondsLeft)
  return { ...timeBreakdown, secondsLeft }
}
