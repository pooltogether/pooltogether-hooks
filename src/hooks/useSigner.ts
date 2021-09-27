import { ethers } from 'ethers'
import { useState, useEffect } from 'react'

export const useSigner = (provider) => {
  const [signer, setSigner] = useState<ethers.providers.JsonRpcSigner>()

  useEffect(() => {
    if (provider) {
      setSigner(provider.getSigner())
    }
  }, [provider])

  return signer
}
