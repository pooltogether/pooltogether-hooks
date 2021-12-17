import { NETWORK } from '@pooltogether/utilities'
import { Provider } from '@ethersproject/abstract-provider'
import { useQuery } from 'react-query'

import { useReadProvider } from './useReadProvider'
import { NO_REFETCH } from '../constants'

export const useEnsName = (address: string) => {
  const readProvider = useReadProvider(NETWORK.mainnet)

  return useQuery(['useEnsName', address], () => getEnsName(readProvider, address), {
    enabled: Boolean(address),
    ...NO_REFETCH
  })
}

const getEnsName = async (provdier: Provider, address: string) => {
  try {
    const resolvedEnsName = await provdier.lookupAddress(address)
    return resolvedEnsName
  } catch (e) {
    console.log(e)
    return undefined
  }
}
