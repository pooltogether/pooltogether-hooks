import { useReducedMotion as framerUseReducedMotion } from 'framer-motion'

function useReducedMotion(props) {
  return process.env.NEXT_JS_REDUCE_MOTION || framerUseReducedMotion()
}

export default useReducedMotion
