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

        trackWalletConnectedGoal(onboard)

        postSignInCallback?.()
      } catch (e) {
        console.error(e)
        console.warn('Onboard error')
      }
    },
    [onboard]
  )

  const disconnectWallet = useCallback(() => {
    try {
      onboard.walletReset()
      Cookies.remove(SELECTED_WALLET_COOKIE_KEY, cookieOptions)
    } catch (e) {
      console.error(e)
      console.warn('Onboard error')
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

const WALLET_CONNECTED_GOALS_MAPPING = {
  MetaMask: '7ES8KJDL'
}

// If Fathom is available track which wallet was connected as a Goal
const trackWalletConnectedGoal = (onboard) => {
  console.log(onboard)
  const wallet = onboard.getState().wallet

  if (wallet) {
    console.log(wallet?.name)
  }

  if (window['fathom']) {
    console.log('fathom is go')
  }

  if (window['fathom'] && wallet?.name) {
    try {
      console.log('trying!')
      console.log(WALLET_CONNECTED_GOALS_MAPPING[wallet.name])
      console.log(window['fathom'].trackGoal)
      window['fathom'].trackGoal(WALLET_CONNECTED_GOALS_MAPPING[wallet.name], 1)
    } catch (e) {
      console.error(
        `${e} - Wallet: '${wallet.name}', possibly new wallet that needs a Goal to be set up for it`
      )
    }
  }
}
