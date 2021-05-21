import { useState, useEffect } from 'react'
import useOnboard from './useOnboard'

const METAMASK_KEY = 'MetaMask'

const useIsWalletMetamask = () => {
  const { wallet } = useOnboard()
  const [isWalletMetamask, setIsWalletMetamask] = useState<boolean>()

  useEffect(() => {
    if (wallet) {
      setIsWalletMetamask(wallet.name === METAMASK_KEY)
    }
  }, [wallet])

  return isWalletMetamask
}

export default useIsWalletMetamask
