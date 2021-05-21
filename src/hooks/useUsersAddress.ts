import useOnboard from './useOnboard'

const useUsersAddress = () => {
  const { address } = useOnboard()
  return address
}

export default useUsersAddress
