import { useEffect, useState } from 'react'

export const useWindowFocus = (onFocus: () => void, onBlur: () => void) => {
  const [focused, setFocus] = useState(true)
  const handleFocus = () => {
    setFocus(true)
    onFocus()
  }
  const handleBlur = () => {
    setFocus(false)
    onBlur()
  }

  useEffect(() => {
    window.addEventListener('focus', handleFocus)
    window.addEventListener('blur', handleBlur)
    return () => {
      window.removeEventListener('focus', handleFocus)
      window.removeEventListener('blur', handleBlur)
    }
  })

  return focused
}
