import React, { useState, useEffect } from 'react'
import { contractABI, contractAddress } from '../lib/constants'
import { client } from '../lib/sanityClient'
import { ethers } from 'ethers'
import { useRouter } from 'next/router'

export const TransactionContext = React.createContext()

let eth

if (typeof window !== 'undefined') {
  eth = window.ethereum
}

const getEthereumContract = () => {
  const provider = new ethers.providers.Web3Provider(eth)
  const signer = provider.getSigner()
  const transactionContract = new ethers.Contract(
    contractAddress,
    contractABI,
    signer,
  )
  return transactionContract
}


export const TransactionProvider = ({ children }) => {
  const [currentAccount, setCurrentAccount] = useState()
  const [isLoading, setIsLoading] = useState(false)
  const router = useRouter()
  const [formData, setFormData] = useState({
    addressTo: '',
    amount: '',
  })


  useEffect(() => {
    checkIfWalletIsConnected()
  }, [])
  useEffect(() => {
    if (!currentAccount) return
      ; (async () => {
        const userDoc = {
          _type: 'users',
          _id: currentAccount,
          userName: 'Unnamed',
          address: currentAccount,

        }
        client.createIfNotExists(userDoc)
      })()
   }, [currentAccount])
  const connectWallet = async (metamask = eth) => {
    try {
      if (!metamask) return alert('Pleease install metamask')
      const accounts = await metamask.request({ method: 'eth_requestAccounts' })
      setCurrentAccount(accounts[0])
    } catch (error) {
      console.error(error)
      throw new Error('No ethereum Object.')
    } 
  }
  const checkIfWalletIsConnected = async (metamask = eth) => {
    try {
      if (!metamask) return alert('Pleease install metamask')

      const accounts = await metamask.request({ method: 'eth_requestAccounts' })

      if (accounts.length) {
        setCurrentAccount(accounts[0])
        console.log('wallet is already connected')
      }
    } catch (error) {
        console.error(error)
        throw new Error('No ethereum Object.')
      } 

  }

  const sendTransaction = async(
    metamask = eth,
    connectedAcount = currentAccount
  ) => {
    try {
      if (!metamask) return alert('Pleease install metamask')
      const { addressTo, amount } = formData
      const transactionContract = getEthereumContract()
      const parsedAmount = ethers.utils.parseEther(amount)

      console.log("Request metamask")
      // console.log(`PRAMS: ${connectedAcount}, ${addressTo}, ${parsedAmount._hex}`)
      // await metamask.request({
      //   method: 'eth_sendTransaction',
      //   params: [
      //     {
      //       from: connectedAcount,
      //       to: addressTo,
      //       gas: '0x7EF40', // 520000 Gwei
      //       value: parsedAmount._hex,
      //     }
      //   ]
      // })

      console.log("Call SmartContract")
      const transactionHash = await transactionContract.publishTransaction(
        addressTo,
        parsedAmount,
        `Transferring ETH ${parsedAmount} to ${addressTo}`,
        'TRANSFER'
      )

      setIsLoading(true)

      console.log("Waiting Contract")
      await transactionHash.wait()
      console.log("End Contract")


      // DB
      console.log(`Commit Transaction ID: ${transactionHash.hash}`)
      await saveTransaction(
        transactionHash.hash,
        amount,
        connectedAcount,
        addressTo
      )
        setIsLoading(false)
    } catch (error) {
      console.log(error)
    }
  }

  const handleChange = (e, name) => {
    setFormData((prevState) => ({ ...prevState, [name]: e.target.value}))
  }

  const saveTransaction = async (
    txHash,
    amount,
    fromAddress = currentAccount,
    toAddress
  ) => {
    const txDoc = {
      _type: 'transactions',
      _id: txHash,
      fromAddress: fromAddress,
      toAddress: toAddress,
      timestamp: new Date(Date.now()).toISOString(),
      txHash: txHash,
      amount: parseFloat(amount),
    }
    await client.createIfNotExists(txDoc)

    await client
      .patch(currentAccount)
      .setIfMissing({ transactions: [] })
      .insert('after', 'transactions[-1]', [
        {
          _key: txHash,
          _ref: txHash,
          _type: 'reference',
        }
      ])
      .commit()

    return
  }

  useEffect(() => {
    if (isLoading) {
      router.push(`/?loading=${currentAccount}`)
    } else {
      router.push(`/`)
    }
   }, [isLoading])

  return (
    <TransactionContext.Provider
      value={{
        currentAccount,
        connectWallet ,
        sendTransaction,
        handleChange,
        formData,
        isLoading,
      }}
    >
        {children}
    </TransactionContext.Provider>
  )

}