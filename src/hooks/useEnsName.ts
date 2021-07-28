import { useState, useEffect } from 'react'

export const useEnsName = (provider, address) => {
  const [ensName, setEnsName] = useState('')

  useEffect(async () => {
    if (address && provider) {
      try {
        const resolvedEnsName = await provider.lookupAddress(address)
        if (resolvedEnsName) {
          setEnsName(resolvedEnsName)
        }
      } catch (e) {
        console.log(e)
      }
    } else {
      setEnsName('')
    }
  }, [address, provider])

  return ensName
}

export default useEnsName