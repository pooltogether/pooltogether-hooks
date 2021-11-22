import { useEffect } from 'react'
import { atom, useAtom } from 'jotai'

export interface RpcApiKeys {
  infura: {
    mainnet?: string
    polygon?: string
  }
  quicknode: {
    bsc?: string
  }
}

export const useRpcApiKeys = () => {
  const [rpcApiKeys] = useAtom(rpcApiKeysAtom)
  return rpcApiKeys
}

export const rpcApiKeysAtom = atom<RpcApiKeys>({ infura: {}, quicknode: {} })

export const useInitRpcApiKeys = (rpcApiKeys: RpcApiKeys) => {
  const [, setRpcApiKeys] = useAtom(rpcApiKeysAtom)
  useEffect(() => {
    console.log('AHH')
    setRpcApiKeys(rpcApiKeys)
  }, [])
}
