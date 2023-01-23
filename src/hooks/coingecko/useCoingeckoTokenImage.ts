import { useCoingeckoTokenData } from './useCoingeckoTokenData'

export const useCoingeckoTokenImage = (chainId, address) => {
  const formattedAddress = address?.toLowerCase()
  const { data, isFetched, isFetching } = useCoingeckoTokenData(chainId, formattedAddress)

  return {
    data: data?.image?.small,
    isFetched,
    isFetching
  }
}
