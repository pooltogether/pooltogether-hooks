import Cookies from 'js-cookie'
import { atom, useAtom } from 'jotai'
import { useCookieOptions } from './useCookieOptions'

const APP_ENVIRONMENT_KEY = '_useTestnets'

export const APP_ENVIRONMENTS = {
  testnets: 'testnets',
  mainnets: 'mainnets'
}

export const getStoredIsTestnetsCookie = () => Boolean(Cookies.get(APP_ENVIRONMENT_KEY))

/**
 * If there's something stored then we want testnets
 */
const isTestnetsAtom = atom(getStoredIsTestnetsCookie())

/**
 * Used to manage what pools we want to display to the user.
 * Determines the current environment based on a cookie & the users wallet.
 * Controlled by a toggle in settings. Toggle was chosen over watching a users
 * wallet for simplicity around all of the edge cases.
 * ex. a user loads /pools/goerli but with their wallet connected to BSC.
 * @returns object
 */
export const useIsTestnets = () => {
  const [isTestnets, setIsTestnetsState] = useAtom(isTestnetsAtom)
  const cookieOptions = useCookieOptions()

  const enableTestnets = () => {
    const cookieValue = 'true'
    console.log({ cookieOptions })
    Cookies.set(APP_ENVIRONMENT_KEY, cookieValue, cookieOptions)
    setIsTestnetsState(true)
  }

  const disableTestnets = () => {
    Cookies.remove(APP_ENVIRONMENT_KEY, cookieOptions)
    setIsTestnetsState(false)
  }

  return { isTestnets, enableTestnets, disableTestnets }
}
