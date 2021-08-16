import { useState, useEffect } from 'react'
import { NETWORK } from '@pooltogether/utilities'

import useReadProvider from './useReadProvider'

export const useEnsName = (address) => {
  const [ensName, setEnsName] = useState('')

  const { readProvider, isReadProviderReady } = useReadProvider(NETWORK.mainnet)

  useEffect(() => {
    const getAndSetEnsName = async () => {
      try {
        const resolvedEnsName = await readProvider.lookupAddress(address)
        if (resolvedEnsName) {
          setEnsName(resolvedEnsName)
        }
      } catch (e) {
        console.log(e)
      }
    }

    if (address && readProvider) {
      getAndSetEnsName()
    } else {
      setEnsName('')
    }
  }, [address, readProvider, isReadProviderReady])

  return ensName
}

export default useEnsName
