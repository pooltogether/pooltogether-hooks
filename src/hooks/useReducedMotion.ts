import { useEffect } from 'react'
import { useReducedMotion as framerUseReducedMotion } from 'framer-motion'
import { atom, useAtom } from 'jotai'

const reducedMotionAtom = atom<boolean>(false)

const useReducedMotion = () => {
  const [reducedMotionOverride] = useAtom(reducedMotionAtom)
  return reducedMotionOverride || framerUseReducedMotion()
}

export const useInitReducedMotion = (reducedMotionOverride: boolean) => {
  const [, setReducedMotionOverride] = useAtom(reducedMotionAtom)
  useEffect(() => {
    setReducedMotionOverride(reducedMotionOverride)
  }, [reducedMotionOverride])
}

export default useReducedMotion
