import { useOnboard } from './useOnboard'

export const useUsersAddress = () => {
  const { address } = useOnboard()
  return address
}
