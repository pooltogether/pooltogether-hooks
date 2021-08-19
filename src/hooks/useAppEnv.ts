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

const storedAppEnv = Cookies.get(APP_ENVIRONMENT_KEY)

/**
 * Overwrite 'production' with 'mainnets'
 * If there's something stored, use it
 * Otherwise set the atom to 'mainnets' and update the cache in useAppEnv mount hook
 */
const appEnvAtom = atom(
  storedAppEnv
    ? storedAppEnv === APP_ENVIRONMENT.production
      ? APP_ENVIRONMENT.mainnets
      : storedAppEnv
    : APP_ENVIRONMENT.mainnets
)

/**
 * Used to manage what pools we want to display to the user.
 * Determines the current environment based on a cookie & the users wallet.
 * Controlled by a toggle in settings. Toggle was chosen over watching a users
 * wallet for simplicity around all of the edge cases.
 * ex. a user loads /pools/rinkeby but with their wallet connected to BSC.
 * @returns string
 */
export const useAppEnv = () => {
  const [appEnv, setAppEnvState] = useAtom(appEnvAtom)
  const cookieOptions = useCookieOptions()

  const setAppEnv = (appEnv) => {
    Cookies.set(APP_ENVIRONMENT_KEY, appEnv, cookieOptions)
    setAppEnvState(appEnv)
  }

  // On mount, if never set before, set in storage
  useEffect(() => {
    const storedAppEnv = Cookies.get(APP_ENVIRONMENT_KEY)
    if (!storedAppEnv || storedAppEnv === APP_ENVIRONMENT.production) {
      Cookies.set(APP_ENVIRONMENT_KEY, APP_ENVIRONMENT.mainnets, cookieOptions)
    }
  }, [])

  return { appEnv, setAppEnv }
}

