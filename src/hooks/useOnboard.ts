import Cookies from 'js-cookie'
import { useCallback, useEffect, useState } from 'react'
import { atom, useAtom } from 'jotai'
import { COOKIE_OPTIONS, SELECTED_WALLET_COOKIE_KEY } from '../constants'
import { ethers } from 'ethers'
import { API, Wallet } from '@pooltogether/bnc-onboard/dist/src/interfaces'

export const onboardAtom = atom<API>(undefined as API)
export const addressAtom = atom<string>(undefined as string)
export const networkAtom = atom<number>(undefined as number)
export const providerAtom = atom<ethers.providers.Web3Provider>(
  undefined as ethers.providers.Web3Provider
)
export const balanceAtom = atom<string>(undefined as string)
export const walletAtom = atom<Wallet>(undefined as Wallet)

const useOnboard = () => {
  const [onboard] = useAtom(onboardAtom)
  const [address] = useAtom(addressAtom)
  const [network] = useAtom(networkAtom)
  const [provider] = useAtom(providerAtom)
  const [balance] = useAtom(balanceAtom)
  const [wallet] = useAtom(walletAtom)

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
    walletName: wallet?.name,
    isWalletConnected: Boolean(wallet) && Boolean(address),
    // Functions
    connectWallet,
    disconnectWallet
  }
}

export default useOnboard
