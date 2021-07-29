import { useEffect } from 'react'
import { atom, useAtom } from 'jotai'

export const quickNodeAtom = atom<string>(undefined as string)

export const useQuickNodeId = () => {
  const [quickNodeId] = useAtom(quickNodeAtom)
  return quickNodeId
}

const useInitQuickNodeId = (quickNodeId) => {
  const [, setQuickNodeId] = useAtom(quickNodeAtom)
  useEffect(() => {
    setQuickNodeId(quickNodeId)
  }, [quickNodeId])
}

export default useInitQuickNodeId
