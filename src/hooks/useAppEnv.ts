import { useEffect } from 'react'
import Cookies from 'js-cookie'
import { atom, useAtom } from 'jotai'
import { useCookieOptions } from './useCookieOptions'

const APP_ENVIRONMENT_KEY = '_app_env'

export const APP_ENVIRONMENT = Object.freeze({
  mainnets: 'mainnets',
  testnets: 'testnets',
  // Old state - some users may have it stored in a cookie though
  production: 'production'
})

const appEnvAtom = atom(
  Cookies.get(APP_ENVIRONMENT_KEY) === APP_ENVIRONMENT.production
    ? APP_ENVIRONMENT.mainnets
    : Cookies.get(APP_ENVIRONMENT_KEY)
)

/**
 * Used to manage what pools we want to display to the user.
 * Determines the current environment based on a cookie & the users wallet.
 * Controlled by a toggle in settings. Toggle was chosen over watching a users
 * wallet for simplicity around all of the edge cases.
 * ex. a user loads /pools/rinkeby but with their wallet connected to BSC.
 * @returns string
 */
const useAppEnv = () => {
  const [appEnv, setAppEnvState] = useAtom(appEnvAtom)
  const cookieOptions = useCookieOptions()

  const setAppEnv = (appEnv) => {
    Cookies.set(APP_ENVIRONMENT_KEY, appEnv, cookieOptions)
    setAppEnvState(appEnv)
  }

  // On mount, if never set before, set in storage
  useEffect(() => {
    if (!appEnv || Cookies.get(APP_ENVIRONMENT_KEY) === APP_ENVIRONMENT.production) {
      setAppEnv(APP_ENVIRONMENT.mainnets)
    }
  }, [])

  return { appEnv, setAppEnv }
}

export default useAppEnv
