import { ethers } from 'ethers'
import { useState, useEffect } from 'react'
import { useOnboard } from './useOnboard'

const useSigner = () => {
  const { provider, onboard } = useOnboard()
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>()

  useEffect(() => {
    if (provider) {
      setSigner(provider.getSigner())
    }
  }, [provider])

  return { provider, signer, walletCheck: onboard.walletCheck as () => Promise<boolean> }
}

export default useSigner
