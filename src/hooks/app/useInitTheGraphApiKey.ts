import { atom, useAtom } from 'jotai'
import { useEffect } from 'react'

const theGraphApiKeyAtom = atom<string>('')

export const useTheGraphApiKey = () => {
  const [graphApiKey] = useAtom(theGraphApiKeyAtom)
  return graphApiKey
}

export const useInitTheGraphApiKey = (graphApiKey: string) => {
  const [, setTheGraphApiKey] = useAtom(theGraphApiKeyAtom)
  useEffect(() => {
    setTheGraphApiKey(graphApiKey)
  }, [graphApiKey])
}
