import { atom, useAtom } from 'jotai'
import { ethers } from 'ethers'
import { getNetworkNameAliasByChainId, poolToast } from '@pooltogether/utilities'

import { useOnboard } from './useOnboard'

const getRevertReason = require('eth-revert-reason')

export const transactionsAtom = atom([])

const DEFAULT_TRANSACTIONS_KEY = 'txs'

const DEFAULT_TX_DETAILS = {
  name: '',
  contractAbi: [],
  contractAddress: '',
  method: '',
  value: 0,
  params: [],
  callbacks: {}
}

export const useSendTransaction = function (t) {
  const [transactions, setTransactions] = useAtom(transactionsAtom)
  const { onboard, address: usersAddress, provider, network: chainId } = useOnboard()

  const sendTx = async (txDetails) => {
    const { name, contractAbi, contractAddress, method, value, params, callbacks } = Object.assign(
      DEFAULT_TX_DETAILS,
      txDetails
    )

    await onboard.walletCheck()

    const txId = transactions.length + 1

    let newTx = {
      __typename: 'Transaction',
      id: txId,
      name,
      inWallet: true,
      method,
      hash: '',
      ...callbacks
    }

    let updatedTransactions = createTransaction(newTx, transactions, setTransactions, usersAddress, chainId)

    callTransaction(
      t,
      updatedTransactions,
      setTransactions,
      newTx,
      provider,
      usersAddress,
      chainId,
      contractAbi,
      contractAddress,
      method,
      params,
      value
    )

    return txId
  }

  return sendTx
}

export const callTransaction = async (
  t,
  transactions,
  setTransactions,
  tx,
  provider,
  usersAddress,
  chainId,
  contractAbi,
  contractAddress,
  method,
  params = [],
  value = 0
) => {
  let ethersTx

  let updatedTransactions = transactions

  const signer = provider.getSigner()

  const contract = new ethers.Contract(contractAddress, contractAbi, signer)

  let gasEstimate
  try {
    gasEstimate = await contract.estimateGas[method](...params)
  } catch (e) {
    console.warn(`error while estimating gas: `, e)
  }

  try {
    poolToast.info(t?.('pleaseConfirmInYourWallet') || 'Please confirm transaction in your wallet')

    // Increase the gas limit by 1.15x as many tx's fail when gas estimate is left at 1x
    const gasLimit = gasEstimate ? gasEstimate.mul(115).div(100) : undefined
    const ethersTx = await contract[method](...params, { gasLimit })

    // Dismisses the "pleaseConfirmInYourWallet" msg which was added because if you are not
    // signed in to MetaMask and run a tx absolutely nothing happens,
    // as well on mobile it can be handy to have a msg pop up when you take an action
    // and the phone hasn't responded yet
    poolToast.dismiss()

    updatedTransactions = updateTransaction(
      tx.id,
      {
        ethersTx,
        sent: true,
        inWallet: false,
        hash: ethersTx.hash
      },
      updatedTransactions,
      setTransactions,
      usersAddress,
      chainId
    )

    poolToast.success(`${tx.name} - ${t?.('transactionSentConfirming') || 'Transaction sent! Confirming...'}`)
    await ethersTx.wait()

    updatedTransactions = updateTransaction(
      tx.id,
      {
        ethersTx,
        completed: true
      },
      updatedTransactions,
      setTransactions,
      usersAddress,
      chainId
    )

    poolToast.rainbow(`${tx.name} - ${t('transactionSuccessful') || 'Transaction successful!'}`)
  } catch (e) {
    console.error(e.message)

    if (e?.message?.match('User denied transaction signature')) {
      updatedTransactions = updateTransaction(
        tx.id,
        {
          cancelled: true,
          completed: true
        },
        updatedTransactions,
        setTransactions,
        usersAddress,
        chainId
      )

      poolToast.warn(t?.('youCancelledTheTransaction') || 'You cancelled the transaction')
    } else {
      let reason, errorMsg

      try {
        if (ethersTx?.hash) {
          const networkName = chainIdToNetworkName(ethersTx.chainId)
          if (networkName === 'mainnet') {
            reason = await getRevertReason(ethersTx.hash, networkName)
          }
        }
      } catch (error2) {
        console.error('Error getting revert reason')
        console.error(error2)
      }

      if (reason?.match('rng-in-flight') || e.message.match('rng-in-flight')) {
        reason = t?.('prizeBeingAwardedPleaseTryAgainSoon') || 'Prize being awarded! Please try again soon'
      }

      errorMsg = reason ? reason : e.data?.message ? e.data.message : e.message

      if (!reason && e?.message?.match('transaction failed')) {
        errorMsg = t?.('transactionFailedUnknownError') || 'Transaction failed: unknown error'
      }

      updatedTransactions = updateTransaction(
        tx.id,
        {
          error: true,
          completed: true,
          reason: errorMsg,
          hash: ethersTx?.hash
        },
        updatedTransactions,
        setTransactions,
        usersAddress,
        chainId
      )

      poolToast.error(`${tx.name} - ${t?.('txFailedToCompleteWithReason') || 'Transaction did not complete:'} ${errorMsg}`)
    }
  }
}

// bring in new list of tx's from localStorage and check
// if any are ongoing & what their status is
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

export const checkTransactionStatuses = (localStorageTransactions, provider, setTransactions, usersAddress, chainId) => {
  localStorageTransactions = localStorageTransactions
    .filter((tx) => tx.sent && !tx.completed)
    .map((tx) => runAsyncCheckTx(tx, provider, localStorageTransactions, setTransactions, usersAddress, chainId))
}

const runAsyncCheckTx = async (tx, provider, transactions, setTransactions, usersAddress, chainId) => {
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

export const updateTransaction = (id, newValues, transactions, setTransactions, usersAddress, chainId) => {
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

export const updateStorageWith = (transactions, usersAddress, chainId, transactionsKey = DEFAULT_TRANSACTIONS_KEY) => {
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

export const clearPreviousTransactions = (transactions, setTransactions, usersAddress, chainId) => {
  const ongoingTransactions = transactions.filter((tx) => !tx.completed)

  setTransactions([...ongoingTransactions])

  updateStorageWith(ongoingTransactions, usersAddress, chainId)
}


export function chainIdToNetworkName(chainId) {
  if (chainId === 137) {
    return 'polygon'
  }

  return getNetworkNameAliasByChainId(chainId)
}

export const useTransaction = (txId) => {
  const [transactions] = useAtom(transactionsAtom)
  if (!txId) return null
  return transactions?.find((tx) => tx.id === txId)
}

export const createTransaction = (newTx, transactions, setTransactions, usersAddress, chainId) => {
  const newTransactions = [...transactions, newTx]
  setTransactions(newTransactions)

  // stash in localStorage to persist state between page reloads
  updateStorageWith(newTransactions, usersAddress, chainId)

  return newTransactions
}

const storageKey = (chainId, usersAddress, transactionsKey) => {
  return `${chainId}-${usersAddress.toLowerCase()}-${transactionsKey}`
}