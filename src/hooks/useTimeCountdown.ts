import { useState } from 'react'
import { useInterval } from 'beautiful-react-hooks'
import { addSeconds } from 'date-fns'
import { msToSeconds, subtractDates } from '@pooltogether/utilities'

/**
 * Compares the range of time now with the time provided and provides a nice data representation to build UIs with
 * @param {number} initialSecondsLeft how many seconds remain in the period
 * @param {number} countBy Optional param for how often this function should run (default to every second) 
 * @returns {object} time representation broken down into days, hours, minutes, seconds and secondsLeft (remaining)
 */
export const useTimeCountdown = (initialSecondsLeft, countBy = 1000) => {
  const [secondsLeft, setSecondsLeft] = useState(initialSecondsLeft < 0 ? 0 : initialSecondsLeft)

  useInterval(() => {
    const secondsToCountBy = msToSeconds(countBy)
    const newRemainder = secondsLeft - secondsToCountBy
    if (newRemainder >= 0) {
      setSecondsLeft(newRemainder)
    }
  }, countBy)

  const currentDate = new Date(Date.now())
  const futureDate = addSeconds(currentDate, secondsLeft)
  const { days, hours, minutes, seconds } = subtractDates(futureDate, currentDate)
  return { days, hours, minutes, seconds, secondsLeft }
}
