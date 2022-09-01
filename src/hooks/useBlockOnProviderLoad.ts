import { useEffect } from 'react'
import { useGovernanceChainId } from './useGovernanceChainId'
import { useReadProvider } from './useReadProvider'

import { atom, useAtom } from 'jotai'
import { Provider } from '@ethersproject/abstract-provider'
import { Block } from '@ethersproject/abstract-provider'

const currentBlockAtom = atom({})

const getBlockNumber = async (
  readProvider: Provider,
  setCurrentBlock: (block: Block & { blockNumber: number }) => void
) => {
  if (readProvider?.getBlockNumber) {
    const blockNumber = await readProvider.getBlockNumber()

    const block = await readProvider.getBlock(blockNumber)
    setCurrentBlock({
      ...block,
      blockNumber
    })
  }
}

export const useBlockOnProviderLoad = () => {
  const chainId = useGovernanceChainId()
  const readProvider = useReadProvider(chainId)
  const [currentBlock, setCurrentBlock] = useAtom(currentBlockAtom)

  useEffect(() => {
    getBlockNumber(readProvider, setCurrentBlock)
  }, [readProvider, chainId])

  return currentBlock
}
