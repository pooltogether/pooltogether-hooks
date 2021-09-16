import { atom, useAtom } from 'jotai'
import { ethers } from 'ethers'
import { getNetworkNiceNameByChainId, getNetworkNameAliasByChainId } from '@pooltogether/utilities'

import { useOnboard } from '../useOnboard'
import { DEFAULT_TRANSACTIONS_KEY, DEFAULT_TX_DETAILS, transactionsAtom } from './constants'
import { Transaction, TransactionOptionalValues } from '../../types/transaction'

const getRevertReason = require('eth-revert-reason')

/**
 * Read latest list of tx's from localStorage and kick off job to check if any are ongoing or what their status is
 * @param {array} transactions (deprecated) array of in mem-store transactions
 * @param {function} setTransactions the mem-store setter function to update the list of transactions in the mem-store
 * @param {number} chainId the network to check for existing transactions on
 * @param {string} usersAddress the current wallet address used in the localStorage lookup key to only find tx's by this sender
 * @param {object} provider the provider/wallet object to use when checking
 * @param {transactionsKey} string customizable key for the localStorage key/val store, defaults to 'tx'
 */
export const readTransactions = (
  transactions,
  setTransactions,
  chainId,
  usersAddress,
  provider,
  transactionsKey = DEFAULT_TRANSACTIONS_KEY
) => {
  try {
    let txs = []
    if (typeof window !== 'undefined') {
      const key = storageKey(chainId, usersAddress, transactionsKey)

      txs = JSON.parse(localStorage.getItem(key))
      txs = txs ? txs : []
    }

    txs = txs.filter((tx) => tx.sent && !tx.cancelled)

    // re-write IDs so transactions are ordered properly
    txs = txs.map((tx, index) => (tx.id = index + 1) && tx)

    setTransactions([...txs])
    checkTransactionStatuses(txs, provider, setTransactions, usersAddress, chainId)
  } catch (e) {
    console.error(e)
  }
}

/**
 * Filters list of transactions to only in-flight ones before checking their status on the chain then kicks off job for each
 * @param {array} localStorageTransactions all tx's pulled for a user on a network from the browser's localStorage cache
 * @param {object} provider the provider/wallet object to use when checking
 * @param {function} setTransactions the mem-store setter function to update the list of transactions
 * @param {string} usersAddress the current wallet address used in the localStorage lookup key to only find tx's by this sender
 * @param {number} chainId the network to check for existing transactions on
 */
export const checkTransactionStatuses = (
  localStorageTransactions,
  provider,
  setTransactions,
  usersAddress,
  chainId
) => {
  localStorageTransactions
    .filter((tx) => tx.sent && !tx.completed)
    .map((tx) =>
      runAsyncCheckTx(
        tx,
        provider,
        localStorageTransactions,
        setTransactions,
        usersAddress,
        chainId
      )
    )
}

/**
 * The job runner to check the status of an in-flight tx on-chain
 * @param {object} tx our local data representation of a single transaction
 * @param {object} provider the provider/wallet object to use when checking
 * @param {array} transactions the filtered list of localStorage transactions
 * @param {function} setTransactions the mem-store setter function to update the list of transactions
 * @param {string} usersAddress the current wallet address used in the localStorage lookup key to only find tx's by this sender
 * @param {number} chainId the network to check for existing transactions on
 */
const runAsyncCheckTx = async (
  tx,
  provider,
  transactions,
  setTransactions,
  usersAddress,
  chainId
) => {
  let ethersTx
  try {
    ethersTx = await provider.getTransaction(tx.hash)

    await ethersTx.wait()

    updateTransaction(
      tx.id,
      {
        ethersTx,
        completed: true
      },
      transactions,
      setTransactions,
      usersAddress,
      chainId
    )
  } catch (e) {
    if (e.message.match('transaction failed')) {
      const networkName = getNetworkNameAliasByChainId(ethersTx.chainId)
      let reason
      if (networkName === 'mainnet') {
        reason = await getRevertReason(tx.hash, networkName)
      }

      updateTransaction(
        tx.id,
        {
          ethersTx,
          reason,
          error: true,
          completed: true
        },
        transactions,
        setTransactions,
        usersAddress,
        chainId
      )
    } else {
      console.error(e)
    }

    if (!ethersTx) {
      updateTransaction(
        tx.id,
        {
          reason: 'Failed to send, could not find transaction on blockchain',
          error: true,
          completed: true
        },
        transactions,
        setTransactions,
        usersAddress,
        chainId
      )
    }
  }
}

/**
 * Helper function to set new values in an existing transaction object
 * @param {number} id the transaction id (txId) of the transaction object to update
 * @param {object} newValues new values for keys to update in the object
 * @param {array} transactions the list of transactions from the mem-store
 * @param {function} setTransactions the mem-store setter function to update the list of transactions
 * @param {string} usersAddress the current wallet address used in the localStorage lookup key for setting a tx into localStorage
 * @param {number} chainId the network to check use in the localStorage lookup key for setting a tx into localStorage
 * @returns {array} the updates list of transactions
 */
export const updateTransaction = (
  id: number,
  newValues: TransactionOptionalValues,
  transactions: Transaction[],
  setTransactions: (transactions: Transaction[]) => void,
  usersAddress: string,
  chainId: number
) => {
  let editedTransactions = transactions.map((transaction) => {
    return transaction.id === id
      ? {
          ...transaction,
          ...newValues
        }
      : transaction
  })

  // runs the actual update of the data store
  const updatedTransactions = [...editedTransactions]
  setTransactions(updatedTransactions)

  // stash in localStorage to persist state between page reloads
  updateStorageWith(updatedTransactions, usersAddress, chainId)

  return updatedTransactions
}

/**
 * Stores the latest list of in mem-store transactions into the browser's localStorage
 * @param {array} transactions the list of transactions from the mem-store
 * @param {string} usersAddress the current wallet address used in the localStorage lookup key for setting a tx into localStorage
 * @param {number} chainId the network to check use in the localStorage lookup key for setting a tx into localStorage
 * @param {transactionsKey} string customizable key for the localStorage key/val store, defaults to 'tx'
 */
export const updateStorageWith = (
  transactions: Transaction[],
  usersAddress: string,
  chainId: number,
  transactionsKey: string = DEFAULT_TRANSACTIONS_KEY
) => {
  const sentTransactions = transactions.filter((tx) => {
    return tx.sent && !tx.cancelled
  })

  chainId = chainId || sentTransactions?.[0]?.ethersTx?.chainId
  usersAddress = usersAddress || sentTransactions?.[0]?.ethersTx?.from

  if (chainId && usersAddress) {
    const txsData = JSON.stringify(sentTransactions)

    try {
      const key = storageKey(chainId, usersAddress, transactionsKey)

      localStorage.setItem(key, txsData)
    } catch (e) {
      console.error(e)
    }
  }
}

/**
 * Removes all completed transactions from the browser's localStorage cache and local mem-store
 * @param {array} transactions the list of transactions from the mem-store
 * @param {function} setTransactions the mem-store function to update the list of transactions in the mem-store
 * @param {string} usersAddress the current wallet address used in the localStorage lookup key for setting a tx into localStorage
 * @param {number} chainId the network to check use in the localStorage lookup key for setting a tx into localStorage
 */
export const clearPreviousTransactions = (transactions, setTransactions, usersAddress, chainId) => {
  const ongoingTransactions = transactions.filter((tx) => !tx.completed)

  setTransactions([...ongoingTransactions])

  updateStorageWith(ongoingTransactions, usersAddress, chainId)
}

/**
 * Creates a new transaction in both the mem-store and the browser's localStorage cache
 * @param {object} newTx new transaction data to add
 * @param {array} transactions the list of transactions from the mem-store
 * @param {function} setTransactions the mem-store function to update the list of transactions in the mem-store
 * @param {string} usersAddress the current wallet address used in the localStorage lookup key for setting a tx into localStorage
 * @param {number} chainId the network to check use in the localStorage lookup key for setting a tx into localStorage
 */
export const createTransaction = (
  newTx: Transaction,
  transactions: Transaction[],
  setTransactions: (transactions: Transaction[]) => void,
  usersAddress: string,
  chainId: number
) => {
  const newTransactions = [...transactions, newTx]
  setTransactions(newTransactions)

  // stash in localStorage to persist state between page reloads
  updateStorageWith(newTransactions, usersAddress, chainId)

  return newTransactions
}

const storageKey = (chainId, usersAddress, transactionsKey) => {
  return `${chainId}-${usersAddress.toLowerCase()}-${transactionsKey}`
}
