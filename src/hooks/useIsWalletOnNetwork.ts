import { useState, useEffect } from 'react'

// network is the network var from useOnboard:
// ie. used to be:
//   const { network } = useOnboard()
export const useIsWalletOnNetwork = (network, chainId: number) => {
  const [isWalletOnNetwork, setIsWalletOnNetwork] = useState<boolean>()

  useEffect(() => {
    if (network && chainId) {
      setIsWalletOnNetwork(chainId === network)
    }
  }, [chainId, network])

  return isWalletOnNetwork
}
