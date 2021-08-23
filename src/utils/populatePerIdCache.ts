import { QueryClient } from 'react-query'

/**
 * Generic function for populating individual caches
 * when querying for lists of data.
 * Ex. Populating the cache for a users token balances for indiviudal
 * tokens after querying for a list of tokens.
 * @param queryClient
 * @param getCacheKey
 * @param data
 * @returns
 */
export const populatePerIdCache = (
  queryClient: QueryClient,
  getCacheKey: (id: (string | number)[]) => (string | number | (string | number)[])[],
  data: object
) => {
  const ids = Object.keys(data)
  if (ids.length === 1) return

  ids.forEach((id) => {
    const datum = data[id]
    queryClient.setQueryData(getCacheKey([id]), { [id]: datum })
  })
}
