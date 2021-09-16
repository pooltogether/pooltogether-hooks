import { useAtom } from 'jotai'
import { transactionsAtom } from './constants'

/**
 * Finds a transaction in the mem-store based on the provided txId
 * @param txId
 * @returns object (Transaction)
 */
export const useTransaction = (txId) => {
  const [transactions] = useAtom(transactionsAtom)
  if (!txId) return null
  return transactions?.find((tx) => tx.id === txId)
}
