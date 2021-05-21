import Cookies from 'js-cookie'
import { useCallback, useEffect, useState } from 'react'
import { atom, useAtom } from 'jotai'
import { COOKIE_OPTIONS, SELECTED_WALLET_COOKIE_KEY } from '../constants'
import { ethers } from 'ethers'
import { API, Wallet } from '@pooltogether/bnc-onboard/dist/src/interfaces'

const onboardAtom = atom<API>(undefined as API)

const useOnboard = () => {
  const [onboard, setOnboard] = useAtom(onboardAtom)
  const [address, setAddress] = useState<string>()
  const [network, setNetwork] = useState<number>()
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>()
  const [balance, setBalance] = useState<string>()
  const [wallet, setWallet] = useState<Wallet>()

  // Initialize Onboard

  const getOnboard = async (): Promise<API> => {
    const initOnboardModule = await import('../services/initOnboard')

    return initOnboardModule.initOnboard({
      address: setAddress,
      network: setNetwork,
      balance: setBalance,
      wallet: (wallet) => {
        if (wallet.provider) {
          setWallet(wallet)
          setProvider(new ethers.providers.Web3Provider(wallet.provider, 'any'))
          Cookies.set(SELECTED_WALLET_COOKIE_KEY, wallet.name, COOKIE_OPTIONS)
        } else {
          setWallet(undefined)
          setProvider(undefined)
          Cookies.remove(SELECTED_WALLET_COOKIE_KEY, COOKIE_OPTIONS)
        }
      }
    })
  }

  const handleLoadOnboard = async () => {
    const onboard = await await getOnboard()
    setOnboard(onboard)
  }

  useEffect(() => {
    handleLoadOnboard()
  }, [])

  // External Functions

  const connectWallet = useCallback(
    async (postSignInCallback) => {
      console.log('connectWallet')
      try {
        // Let user select wallet
        console.log('pre walletSelected', onboard)
        const walletSelected = await onboard.walletSelect()
        console.log('post walletSelected', walletSelected, onboard)
        if (!walletSelected) {
          return
        }

        const walletIsReady = await onboard.walletCheck()
        console.log('post walletIsReady', walletIsReady, onboard)
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
    console.log('disconnectWallet')
    try {
      onboard.walletReset()
      Cookies.remove(SELECTED_WALLET_COOKIE_KEY, COOKIE_OPTIONS)
    } catch (e) {
      console.warn("Onboard isn't ready!")
    }
  }, [onboard])

  // Internal Functions

  const setSelectedWallet = useCallback(
    (selectedWallet) => {
      try {
        onboard.walletSelect(selectedWallet)
      } catch (e) {
        console.warn("Onboard isn't ready!")
      }
    },
    [onboard]
  )

  // Hooks

  // Auto sign in
  useEffect(() => {
    const previouslySelectedWallet = Cookies.get(SELECTED_WALLET_COOKIE_KEY)
    console.log(
      'Auto sign in',
      onboard && Boolean(previouslySelectedWallet),
      previouslySelectedWallet
    )
    if (onboard && Boolean(previouslySelectedWallet)) {
      disconnectWallet()
      setSelectedWallet(previouslySelectedWallet)
    }
  }, [onboard])

  return {
    // Data
    onboard,
    address,
    network,
    provider,
    balance,
    wallet,
    // Convenience
    walletName: wallet.name,
    isWalletConnected: Boolean(wallet),
    // Functions
    connectWallet,
    disconnectWallet
  }
}

export default useOnboard
