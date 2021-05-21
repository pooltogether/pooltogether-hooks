import { useState, useEffect } from 'react'
import useOnboard from './useOnboard'

const useIsWalletOnNetwork = (chainId: number) => {
  const { network } = useOnboard()
  const [isWalletOnNetwork, setIsWalletOnNetwork] = useState<boolean>()

  useEffect(() => {
    if (network && chainId) {
      setIsWalletOnNetwork(chainId === network)
    }
  }, [chainId, network])

  return isWalletOnNetwork
}

export default useIsWalletOnNetwork
