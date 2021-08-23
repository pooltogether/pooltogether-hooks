import { useEffect } from 'react'
import { atom, useAtom } from 'jotai'

export const infuraAtom = atom<string>(undefined as string)

export const useInfuraId = () => {
  const [infuraId] = useAtom(infuraAtom)
  return infuraId
}

export const useInitInfuraId = (infuraId) => {
  const [, setInfuraId] = useAtom(infuraAtom)
  useEffect(() => {
    setInfuraId(infuraId)
  }, [infuraId])
}
