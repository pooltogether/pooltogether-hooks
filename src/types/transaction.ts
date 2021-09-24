import { TransactionResponse, TransactionReceipt } from '@ethersproject/abstract-provider'

export interface PoolToast {
  info: (text: string) => void
  success: (text: string) => void
  rainbow: (text: string) => void
  warn: (text: string) => void
  error: (text: string) => void
  dismiss: () => void
}

export enum TransactionState {
  pending = 'pending', // TransactionStatus.inWallet || TransactionStatus.confirming
  complete = 'complete' // TransactionStatus.cancelled || TransactionStatus.error || TransactionStatus.success
}

export enum TransactionStatus {
  inWallet = 'inWallet',
  confirming = 'confirming',
  cancelled = 'cancelled',
  error = 'error',
  success = 'success'
}

export interface PreTransactionDetails {
  name: string
  method: string
  callbacks?: TransactionCallbacks
  // callTransaction?: creates an ethers contract & calls the method with the proper params & overrides
  callTransaction?: () => Promise<TransactionResponse>
  // Details needed to create an ethers contract & call a method
  value?: number
  params?: any[]
  contractAbi?: object[]
  contractAddress?: string
}

export interface TransactionCallbacks {
  refetch?: (tx?: Transaction) => void
  onSuccess?: (tx?: Transaction) => void
  onSent?: (tx?: Transaction) => void
  onCancelled?: (tx?: Transaction) => void
  onError?: (tx?: Transaction) => void
}

export interface Transaction extends TransactionOptionalValues, TransactionCallbacks {
  __typename: 'Transaction'
  id: number
  name: string
  method: string
}

export interface TransactionOptionalValues {
  hash?: string
  usersAddress?: string
  chainId?: number
  ethersTx?: TransactionResponse
  ethersTxReceipt?: TransactionReceipt
  // Tx status
  inFlight?: boolean
  inWallet?: boolean
  sent?: boolean
  completed?: boolean
  cancelled?: boolean
  error?: boolean
  reason?: string
}
