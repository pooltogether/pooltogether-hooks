import { getNetworkNiceNameByChainId } from '@pooltogether/utilities'
import { ethers } from 'ethers'
import { useAtom } from 'jotai'
import { DEFAULT_TX_DETAILS, transactionsAtom } from './constants'
import { createTransaction, updateTransaction } from './helpers'
import { getRevertReason } from 'eth-revert-reason'
import { PoolToast, PreTransactionDetails, Transaction } from '../../types/transaction'
import { JsonRpcProvider } from '@ethersproject/providers'
import { TransactionResponse, Provider } from '@ethersproject/abstract-provider'

/**
 * A hook for firing off transactions to the blockchain
 * @param t translation object from useTranslation hook
 * @param poolToast poolToast object from @pooltogether/react-components library for displaying toast messages
 * @returns async function 'sendTx'
 */
export const useSendTransaction = (
  t: (key: string) => string,
  poolToast: PoolToast,
  usersAddress: string,
  provider: Provider,
  chainId: number
) => {
  const [transactions, setTransactions] = useAtom(transactionsAtom)

  const sendTx = async (txDetails: PreTransactionDetails) => {
    const { name, contractAbi, contractAddress, method, params, callbacks } = Object.assign(
      DEFAULT_TX_DETAILS,
      txDetails
    )

    const txId = transactions.length + 1

    let newTx = {
      __typename: 'Transaction',
      id: txId,
      name,
      method,
      inWallet: true,
      hash: '',
      ethersTx: undefined,
      ethersTxReceipt: undefined,
      ...callbacks
    } as Transaction

    console.log('newTx', newTx)

    let updatedTransactions = createTransaction(
      newTx,
      transactions,
      setTransactions,
      usersAddress,
      chainId
    )

    const callTx = Boolean(txDetails.callTransaction)
      ? txDetails.callTransaction
      : async () =>
          callTransaction(provider as JsonRpcProvider, contractAddress, contractAbi, method, params)

    console.log('callTx', callTx)

    watchTransactionLifecycle(
      t,
      poolToast,
      updatedTransactions,
      setTransactions,
      newTx,
      usersAddress,
      chainId,
      callTx
    )

    return txId
  }

  return sendTx
}

const callTransaction = async (
  provider: JsonRpcProvider,
  contractAddress: string,
  contractAbi: object[],
  method: string,
  params: any[]
): Promise<TransactionResponse> => {
  const signer = provider.getSigner()
  const contract = new ethers.Contract(contractAddress, contractAbi, signer)
  let gasEstimate
  try {
    gasEstimate = await contract.estimateGas[method](...params)
  } catch (e) {
    console.warn(`error while estimating gas: `, e)
  }
  // Increase the gas limit by 1.15x as many tx's fail when gas estimate is left at 1x
  const gasLimit = gasEstimate ? gasEstimate.mul(115).div(100) : undefined
  return await contract[method](...params, { gasLimit })
}

/**
 * Internal async method used by useSendTransaction hook for sending transactions using Ethers.js lib &
 * updating them throughout their lifecycle
 * @param {object} t translation object from useTranslation hook
 * @param {object} poolToast poolToast object from @pooltogether/react-components library for displaying toast messages
 * @param {array} transactions most recent array of transactions including the newly created tx from useSendTransaction() hook
 * @param {function} setTransactions the mem-store setter function to update the list of transactions in the mem-store
 * @param {object} tx our local transaction instance used to store data before the ethersTx is created
 * @param {string} usersAddress the sender's address
 * @param {number} chainId The network to call the tx on
 */
const watchTransactionLifecycle = async (
  t: (key: string) => string,
  poolToast: PoolToast,
  transactions: Transaction[],
  setTransactions: (transactions: Transaction[]) => void,
  tx: Transaction,
  usersAddress: string,
  chainId: number,
  callTransaction: () => Promise<TransactionResponse>
) => {
  let ethersTx: TransactionResponse

  let updatedTransactions = transactions

  try {
    poolToast.info(t?.('pleaseConfirmInYourWallet') || 'Please confirm transaction in your wallet')

    const ethersTx = await callTransaction()

    // Chain id may be set to 0 if EIP-155 is disabled and legacy signing is used
    // See https://docs.ethers.io/v5/api/utils/transactions/#Transaction
    if (ethersTx.chainId === 0) {
      ethersTx.chainId = chainId
    }

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
        hash: ethersTx.hash,
        inFlight: true
      },
      updatedTransactions,
      setTransactions,
      usersAddress,
      chainId
    )

    poolToast.success(
      `"${tx.name}" ${t?.('transactionSentConfirming') || 'Transaction sent! Confirming...'}`
    )
    const ethersTxReceipt = await ethersTx.wait()

    updatedTransactions = updateTransaction(
      tx.id,
      {
        ethersTx,
        ethersTxReceipt,
        completed: true,
        inFlight: false
      },
      updatedTransactions,
      setTransactions,
      usersAddress,
      chainId
    )

    poolToast.rainbow(`"${tx.name}" ${t('transactionSuccessful') || 'Transaction successful!'}`)
  } catch (e) {
    console.error(e.message)

    if (e?.message?.match('User denied transaction signature')) {
      updatedTransactions = updateTransaction(
        tx.id,
        {
          cancelled: true,
          completed: true,
          inFlight: false
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
          const networkName = getNetworkNiceNameByChainId(ethersTx?.chainId || chainId)
          if (networkName === 'mainnet') {
            reason = await getRevertReason(ethersTx.hash, networkName)
          }
        }
      } catch (error2) {
        console.error('Error getting revert reason')
        console.error(error2)
      }

      if (reason?.match('rng-in-flight') || e.message.match('rng-in-flight')) {
        reason =
          t?.('prizeBeingAwardedPleaseTryAgainSoon') || 'Prize being awarded! Please try again soon'
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
          inFlight: false,
          reason: errorMsg,
          hash: ethersTx?.hash
        },
        updatedTransactions,
        setTransactions,
        usersAddress,
        chainId
      )

      poolToast.error(
        `"${tx.name}" ${
          t?.('txFailedToCompleteWithReason') || 'Transaction did not complete:'
        } ${errorMsg}`
      )
    }
  }
}
