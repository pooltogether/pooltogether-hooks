import Cookies from 'js-cookie'
import { useCallback } from 'react'
import { useAtom } from 'jotai'
import {
  addressAtom,
  balanceAtom,
  networkAtom,
  onboardAtom,
  providerAtom,
  networkNameAtom,
  walletAtom
} from './useInitializeOnboard'
import { SELECTED_WALLET_COOKIE_KEY } from '../constants'
import { useCookieOptions } from './useCookieOptions'

export const useOnboard = () => {
  const [onboard] = useAtom(onboardAtom)
  const [address] = useAtom(addressAtom)
  const [network] = useAtom(networkAtom)
  const [networkName] = useAtom(networkNameAtom)
  const [provider] = useAtom(providerAtom)
  const [balance] = useAtom(balanceAtom)
  const [wallet] = useAtom(walletAtom)

  const cookieOptions = useCookieOptions()

  // External Functions

  const connectWallet = useCallback(
    async (postSignInCallback) => {
      try {
        // Let user select wallet
        const walletSelected = await onboard.walletSelect()
        if (!walletSelected) {
          return
        }

        const walletIsReady = await onboard.walletCheck()
        if (!walletIsReady) {
          return
        }

        postSignInCallback?.()
      } catch (e) {
        console.warn("Onboard isn't ready!")
      }
    },
    [onboard]
  )

  const disconnectWallet = useCallback(() => {
    try {
      onboard.walletReset()
      Cookies.remove(SELECTED_WALLET_COOKIE_KEY, cookieOptions)
    } catch (e) {
      console.warn("Onboard isn't ready!")
    }
  }, [onboard, cookieOptions])

  // Hooks

  return {
    // Data
    onboard,
    address,
    network,
    provider,
    balance,
    wallet,
    // Convenience
    networkName,
    walletName: wallet?.name,
    isWalletConnected: Boolean(wallet) && Boolean(address),
    isOnboardReady: Boolean(onboard),
    // Functions
    connectWallet,
    disconnectWallet
  }
}
