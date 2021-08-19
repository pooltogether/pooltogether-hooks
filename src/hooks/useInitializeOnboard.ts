import Cookies from 'js-cookie'
import { useCallback, useEffect } from 'react'
import { atom, useAtom } from 'jotai'
import { ethers } from 'ethers'
import { API, Wallet } from '@pooltogether/bnc-onboard/dist/src/interfaces'
import Onboard from '@pooltogether/bnc-onboard'
import { getNetworkNameAliasByChainId, getChainIdByAlias } from '@pooltogether/utilities'

import { SELECTED_WALLET_COOKIE_KEY } from '../constants'
import { useCookieOptions } from './useCookieOptions'

export const onboardAtom = atom<API>(undefined as API)
export const addressAtom = atom<string>(undefined as string)
export const networkAtom = atom<number>(undefined as number)
export const networkNameAtom = atom<string>((get) => getNetworkNameAliasByChainId(get(networkAtom)))
export const providerAtom = atom<ethers.providers.Web3Provider>(
  undefined as ethers.providers.Web3Provider
)
export const balanceAtom = atom<string>(undefined as string)
export const walletAtom = atom<Wallet>(undefined as Wallet)

export const useInitializeOnboard = (
  config: {
    infuraId?: string
    fortmaticKey?: string
    portisKey?: string
    defaultNetworkName: string
  } = { defaultNetworkName: 'mainnet' }
) => {
  const [onboard, setOnboard] = useAtom(onboardAtom)
  const [address, setAddress] = useAtom(addressAtom)
  const [network, setNetwork] = useAtom(networkAtom)
  const [provider, setProvider] = useAtom(providerAtom)
  const [balance, setBalance] = useAtom(balanceAtom)
  const [wallet, setWallet] = useAtom(walletAtom)

  const cookieOptions = useCookieOptions()

  // Initialize Onboard

  const getOnboard = async (): Promise<API> => {
    return initOnboard(
      {
        address: setAddress,
        network: setNetwork,
        balance: setBalance,
        wallet: (wallet) => {
          if (wallet.provider) {
            setWallet(wallet)
            setProvider(new ethers.providers.Web3Provider(wallet.provider, 'any'))
            Cookies.set(SELECTED_WALLET_COOKIE_KEY, wallet.name, cookieOptions)
          } else {
            setWallet(undefined)
            setProvider(undefined)
            Cookies.remove(SELECTED_WALLET_COOKIE_KEY, cookieOptions)
          }
        }
      },
      config
    )
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
      Cookies.remove(SELECTED_WALLET_COOKIE_KEY, cookieOptions)
    } catch (e) {
      console.warn("Onboard isn't ready!")
    }
  }, [onboard, cookieOptions])

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

const initOnboard = (subscriptions, walletConfig) => {
  const onboard = Onboard

  const APP_NAME = 'PoolTogether'
  const {
    infuraId: INFURA_ID,
    fortmaticKey: FORTMATIC_KEY,
    portisKey: PORTIS_KEY,
    defaultNetworkName
  } = walletConfig

  const defaultNetworkId = getChainIdByAlias(defaultNetworkName)
  const RPC_URL =
    defaultNetworkName && INFURA_ID
      ? `https://${defaultNetworkName}.infura.io/v3/${INFURA_ID}`
      : 'http://localhost:8545'

  const walletConnectOptions = {
    infuraKey: INFURA_ID,
    preferred: true,
    bridge: 'https://pooltogether.bridge.walletconnect.org/'
  }

  const WALLETS_CONFIG = [
    { walletName: 'metamask', preferred: true },
    {
      walletName: 'walletConnect',
      ...walletConnectOptions
    },
    { walletName: 'rainbow', preferred: true, ...walletConnectOptions },
    { walletName: 'argent', preferred: true, ...walletConnectOptions },
    { walletName: 'trustWallet', preferred: true, ...walletConnectOptions },
    { walletName: 'gnosisSafe', preferred: true, ...walletConnectOptions },
    { walletName: 'trust', preferred: true, rpcUrl: RPC_URL },
    { walletName: 'coinbase', preferred: true },
    {
      walletName: 'walletLink',
      preferred: true,
      rpcUrl: RPC_URL
    },
    {
      walletName: 'trezor',
      preferred: true,
      appUrl: 'https://app.pooltogether.com',
      email: 'hello@pooltogether.com',
      rpcUrl: RPC_URL
    },
    {
      walletName: 'ledger',
      preferred: true,
      rpcUrl: RPC_URL
    },
    {
      walletName: 'fortmatic',
      preferred: true,
      apiKey: FORTMATIC_KEY
    },
    {
      walletName: 'imToken',
      preferred: true,
      rpcUrl: RPC_URL
    },
    {
      walletName: 'dcent',
      preferred: true
    },
    {
      walletName: 'huobiwallet',
      preferred: true,
      rpcUrl: RPC_URL
    },
    {
      walletName: 'portis',
      preferred: true,
      apiKey: PORTIS_KEY
    },
    {
      walletName: 'authereum',
      preferred: true
    },
    {
      walletName: 'status',
      preferred: true
    },
    {
      walletName: 'torus',
      preferred: true
    },
    {
      walletName: 'lattice',
      preferred: true,
      rpcUrl: RPC_URL,
      appName: APP_NAME
    },
    {
      walletName: 'mykey',
      preferred: true,
      rpcUrl: RPC_URL
    },
    {
      walletName: 'opera',
      preferred: true
    },
    {
      walletName: 'operaTouch',
      preferred: true
    },
    {
      walletName: 'web3Wallet',
      preferred: true
    }
  ]

  return onboard({
    hideBranding: true,
    networkId: defaultNetworkId,
    darkMode: true,
    subscriptions,
    walletSelect: {
      wallets: WALLETS_CONFIG
    },
    walletCheck: [
      { checkName: 'derivationPath' },
      { checkName: 'connect' },
      { checkName: 'accounts' },
      { checkName: 'network' }
    ]
  })
}
