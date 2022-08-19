import { useState } from 'react'
import useWindowScroll from 'beautiful-react-hooks/useWindowScroll'
import useDebouncedCallback from 'beautiful-react-hooks/useDebouncedCallback'

export const useOnScroll = (options: {
  onScroll?: () => void
  onScrollUp?: () => void
  onScrollTop?: () => void
  onScrollDown?: () => void
}) => {
  const [prevScrollTop, setScrollTop] = useState(window.scrollY)
  const onWindowScroll = useWindowScroll()
  const { onScroll, onScrollDown, onScrollUp, onScrollTop } = options

  const _onWindowScroll = useDebouncedCallback(
    (event: UIEvent) => {
      const newScrollTop = event.target['scrollingElement'].scrollTop
      if (newScrollTop <= 10) {
        onScrollTop?.()
      } else if (newScrollTop < prevScrollTop) {
        onScrollDown?.()
      } else if (newScrollTop >= prevScrollTop) {
        onScrollUp?.()
      }
      onScroll?.()
      setScrollTop(newScrollTop)
    },
    [onScroll, onScrollDown, onScrollUp],
    200,
    { leading: true }
  )

  onWindowScroll(_onWindowScroll)
}
