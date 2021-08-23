import { useEffect } from 'react'
import { atom, useAtom } from 'jotai'

export const theGraphApiKeyAtom = atom<string>(undefined as string)

export const useTheGraphApiKey = () => {
  const [graphApiKey] = useAtom(theGraphApiKeyAtom)
  return graphApiKey
}

export const useInitTheGraphApiKey = (graphApiKey) => {
  const [, setTheGraphApiKey] = useAtom(theGraphApiKeyAtom)
  useEffect(() => {
    setTheGraphApiKey(graphApiKey)
  }, [graphApiKey])
}
