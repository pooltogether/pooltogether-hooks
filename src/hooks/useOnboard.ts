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
  'MetaMask': '7ES8KJDL',
  'WalletConnect': 'QRMTASRB',
  'Rainbow': 'FX8BNN3H',
  'Argent': 'F1RWQBVS',
  'Trust Wallet': 'X7JOP245',
  'Gnosis Safe': 'GT9K2R3Z',
  'Coinbase Wallet': 'PIYGDMAR',
  'Trezor': 'TU6DAWAZ',
  'Ledger': 'JHPHUI00',
  'Fortmatic': 'SYCBUNUA',
  'Portis': 'GFPDI0OW',
  'Authereum': 'F5U95ZHJ',
  'Torus': '0W1QGAYE',
  'Lattice': '4HZXMHK8',
  'Opera': 'VFMCHT9R',
  'Opera Touch': 'DS0XRUCJ',
  'MYKEY': 'ZGKE5KFX',
  'Huobi Wallet': 'UX6WJNB3',
  "D'CENT": 'HDO2XUKB',
  'imToken': '7IBOGHSP',
  'Web3 Wallet': '3BVHUJM2'
}

// If Fathom is available track which wallet was connected as a Goal
const trackWalletConnectedGoal = (onboard) => {
  const wallet = onboard.getState().wallet

  if (window['fathom'] && wallet?.name) {
    const goalCode = WALLET_CONNECTED_GOALS_MAPPING[wallet.name]

    if (!goalCode) {
      console.warn(`Wallet: '${wallet.name}', wallet needs Fathom Goal set up for it`)
      return
    }

    window['fathom'].trackGoal(goalCode, 1)
  }
}
