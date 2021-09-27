import { useState, useEffect } from 'react'

const METAMASK_KEY = 'MetaMask'

// wallet is the wallet object from useOnboard:
// ie. used to be:
//   const { wallet } = useOnboard()
export const useIsWalletMetamask = (wallet): Boolean => {
  const [isWalletMetamask, setIsWalletMetamask] = useState<boolean>()

  useEffect(() => {
    if (wallet) {
      setIsWalletMetamask(wallet.name === METAMASK_KEY)
    }
  }, [wallet])

  return isWalletMetamask
}
