import { useEffect } from 'react'
import { useGovernanceChainId } from './useGovernanceChainId'
import { useReadProvider } from './useReadProvider'

import { atom, useAtom } from 'jotai'

const currentBlockAtom = atom({})

export const getBlockNumber = async (readProvider, setCurrentBlock) => {
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
  const { readProvider } = useReadProvider(chainId)
  const [currentBlock, setCurrentBlock] = useAtom(currentBlockAtom)

  useEffect(() => {
    getBlockNumber(readProvider, setCurrentBlock)
  }, [readProvider, chainId])

  return currentBlock
}
