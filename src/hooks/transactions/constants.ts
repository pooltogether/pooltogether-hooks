import { atom } from 'jotai'
import { PreTransactionDetails, Transaction } from '../../types/transaction'

export const transactionsAtom = atom<Transaction[]>([])

export const DEFAULT_TRANSACTIONS_KEY = 'txs'

export const DEFAULT_TX_DETAILS: PreTransactionDetails = {
  name: '',
  contractAbi: [],
  contractAddress: '',
  method: '',
  value: 0,
  params: [],
  callbacks: {}
}
