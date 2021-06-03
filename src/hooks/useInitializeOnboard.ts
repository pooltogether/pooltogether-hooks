import Cookies from 'js-cookie'
import { useCallback, useEffect, useState } from 'react'
import { atom, useAtom } from 'jotai'
import { COOKIE_OPTIONS, SELECTED_WALLET_COOKIE_KEY } from '../constants'
import { ethers } from 'ethers'
import { API, Wallet } from '@pooltogether/bnc-onboard/dist/src/interfaces'
import {
  addressAtom,
  balanceAtom,
  networkAtom,
  onboardAtom,
  providerAtom,
  walletAtom
} from './useOnboard'
import { initOnboard } from '../services/initOnboard'

const useInitializeOnboard = () => {
  const [onboard, setOnboard] = useAtom(onboardAtom)
  const [address, setAddress] = useAtom(addressAtom)
  const [network, setNetwork] = useAtom(networkAtom)
  const [provider, setProvider] = useAtom(providerAtom)
  const [balance, setBalance] = useAtom(balanceAtom)
  const [wallet, setWallet] = useAtom(walletAtom)

  // Initialize Onboard

  const getOnboard = async (): Promise<API> => {
    return initOnboard({
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

  const disconnectWallet = useCallback(() => {
    try {
      onboard.walletReset()
      Cookies.remove(SELECTED_WALLET_COOKIE_KEY, COOKIE_OPTIONS)
    } catch (e) {
      console.warn("Onboard isn't ready!")
    }
  }, [onboard])

  // Hooks

  // Auto sign in
  useEffect(() => {
    const previouslySelectedWallet = Cookies.get(SELECTED_WALLET_COOKIE_KEY)
    if (onboard && Boolean(previouslySelectedWallet)) {
      disconnectWallet()
      setSelectedWallet(previouslySelectedWallet)
    }
  }, [onboard])
}

export default useInitializeOnboard
