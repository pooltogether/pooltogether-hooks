import { formatUnits } from '@ethersproject/units'
import { ethers, BigNumber } from 'ethers'
import { useQuery } from 'react-query'
import { batch, contract } from '@pooltogether/etherplex'
import { SECONDS_PER_DAY } from '@pooltogether/current-pool-data'
import { NETWORK } from '@pooltogether/utilities'

import { NO_REFETCH, QUERY_KEYS } from '../constants'
import { TokenFaucetAbi } from '../abis/TokenFaucet_3_3_12'
import { ERC20Abi } from '../abis/ERC20Abi'
import { useIsTestnets, useReadProvider } from '..'
import { prettyNumber } from './useUsersPrizePoolBalances'
import { TokenWithBalance } from '../types/token'

const ONE_MINUTE_IN_MILLISECONDS = 60000

const REFETCH_SETTINGS = {
  refetchInterval: ONE_MINUTE_IN_MILLISECONDS,
  refetchIntervalInBackground: false,
  refetchOnMount: false,
  refetchOnReconnect: false,
  refetchOnWindowFocus: false
}

export const DEXES = {
  UniSwap: 'UniSwap',
  SushiSwap: 'SushiSwap'
}

export interface UserLPChainData {
  balances: {
    token: TokenWithBalance
    ticket: TokenWithBalance
  }
  userData: {
    tokenFaucet: {
      balance: string
      balanceUnformatted: BigNumber
    }
    underlyingToken: {
      balance: string
      balanceUnformatted: BigNumber
      allowance: BigNumber
    }
    tickets: {
      balance: string
      balanceUnformatted: BigNumber
      ownershipPercentage: string
    }
    claimableBalance: string
    claimableBalanceUnformatted: BigNumber
    dripTokensPerDay: string
    dripTokensPerDayUnformatted: BigNumber
  }
}

const STAKING_POOLS = Object.freeze({
  1: [
    {
      prizePool: {
        chainId: 1,
        address: '0x3af7072d29adde20fc7e173a7cb9e45307d2fb0a'
      },
      tokens: {
        ticket: {
          address: '0xeb8928ee92efb06c44d072a24c2bcb993b61e543',
          name: 'PT UNI-V2 LP Ticket',
          symbol: 'PTUNI POOL-ETH'
        },
        underlyingToken: {
          address: '0x85cb0bab616fe88a89a35080516a8928f38b518b',
          dex: DEXES.UniSwap,
          name: 'Uniswap POOL/ETH LP',
          pair: 'POOL/ETH',
          symbol: 'UNI-V2 LP',
          token1: {
            symbol: 'POOL',
            address: '0x0cEC1A9154Ff802e7934Fc916Ed7Ca50bDE6844e'
          },
          token2: {
            symbol: 'ETH',
            address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' // WETH
          }
        },
        tokenFaucetDripToken: {
          address: '0x0cEC1A9154Ff802e7934Fc916Ed7Ca50bDE6844e',
          symbol: 'POOL'
        }
      },
      tokenFaucet: {
        address: '0x9a29401ef1856b669f55ae5b24505b3b6faeb370'
      }
    }
    // Tested with the SUSHI POOL/ETH LP position, but no rewards for that yet
    // {
    //     prizePool: {
    //       chainId: 1,
    //       address: '0x3af7072d29adde20fc7e173a7cb9e45307d2fb0a'
    //     },
    //     tokens: {
    //       ticket: {
    //         address: '0xeb8928ee92efb06c44d072a24c2bcb993b61e543'
    //       },
    //       underlyingToken: {
    //         address: '0x577959c519c24ee6add28ad96d3531bc6878ba34',
    //         dex: DEXES.SushiSwap,
    //         pair: 'POOL/ETH',
    //         symbol: 'UNI-V2 LP',
    //         token1: {
    //           symbol: 'POOL',
    //           address: '0x0cEC1A9154Ff802e7934Fc916Ed7Ca50bDE6844e'
    //         },
    //         token2: {
    //           symbol: 'ETH',
    //           address: '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2' // WETH
    //         }
    //       },
    //       tokenFaucetDripToken: {
    //         address: '0x0cEC1A9154Ff802e7934Fc916Ed7Ca50bDE6844e',
    //         symbol: 'POOL'
    //       }
    //     },
    //     tokenFaucet: {
    //       address: '0x9a29401ef1856b669f55ae5b24505b3b6faeb370'
    //     }
    // }
  ],
  4: [
    {
      prizePool: {
        chainId: 4,
        address: '0x8A358f613ddCca865D005414c1690920E4e9b132'
      },
      tokens: {
        ticket: {
          address: '0x9b8c6fd165e0bffb93e6f2cf564d2cc7271e120f'
        },
        underlyingToken: {
          address: '0x91A590A2D78c71775318524c198a0f2000112108',
          pair: 'POOL/ETH',
          symbol: 'UNI-V2 LP',
          token1: {
            symbol: 'POOL',
            address: '0xc4E90a8Dc6CaAb329f08ED3C8abc6b197Cf0F40A'
          },
          token2: {
            symbol: 'ETH',
            address: '0xc778417e063141139fce010982780140aa0cd5ab'
          }
        },
        tokenFaucetDripToken: {
          address: '0xc4E90a8Dc6CaAb329f08ED3C8abc6b197Cf0F40A',
          symbol: 'POOL'
        }
      },
      tokenFaucet: {
        address: '0x97B99693613aaA74A3fa0B2f05378b8F6A74a893' // BAT POOL TOKEN FAUCET
      }
    }
  ]
})

export const useStakingPoolChainData = (stakingPool) => {
  const { isTestnets } = useIsTestnets()
  const chainId = isTestnets ? NETWORK.rinkeby : NETWORK.mainnet

  // const { readProvider, isReadProviderReady: readProviderIsFetched } = useReadProvider(chainId)
  const readProvider = useReadProvider(chainId)
  // const enabled = readProviderIsFetched
  const enabled = true

  return useQuery(
    [QUERY_KEYS.uniswapLPStakingPool, chainId, stakingPool.prizePool.address],
    () => getStakingPoolData(readProvider, stakingPool),
    { enabled, ...REFETCH_SETTINGS }
  )
}

export const useUserLPChainData = (stakingPool, stakingPoolChainData, usersAddress) => {
  const { isTestnets } = useIsTestnets()
  const chainId = isTestnets ? NETWORK.rinkeby : NETWORK.mainnet

  // const { readProvider, isReadProviderReady: readProviderIsFetched } = useReadProvider(chainId)
  const readProvider = useReadProvider(chainId)
  // const enabled = Boolean(usersAddress) && readProviderIsFetched && Boolean(stakingPoolChainData)
  const enabled = Boolean(usersAddress) && Boolean(stakingPoolChainData)

  return useQuery(
    [QUERY_KEYS.uniswapLPStakingPool, chainId, stakingPool.prizePool.address, usersAddress],
    () => getUserLPChainData(readProvider, usersAddress, stakingPool, stakingPoolChainData),
    {
      enabled,
      ...REFETCH_SETTINGS
    }
  )
}

export const useStakingPoolChainId = () => {
  const { isTestnets } = useIsTestnets()
  return isTestnets ? NETWORK.rinkeby : NETWORK.mainnet
}

export const useStakingPools = () => {
  const chainId = useStakingPoolChainId()
  return STAKING_POOLS[chainId]
}

const getStakingPoolData = async (readProvider, stakingPool) => {
  const { tokenFaucet, tokens } = stakingPool
  const { underlyingToken, ticket, tokenFaucetDripToken } = tokens

  const tokenFaucetAddress = tokenFaucet.address
  const underlyingTokenAddress = underlyingToken.address
  const ticketAddress = ticket.address
  const dripTokenAddress = tokenFaucetDripToken.address

  const underlyingTokenContract = contract('underlyingToken', ERC20Abi, underlyingTokenAddress)
  const dripTokenContract = contract('dripToken', ERC20Abi, dripTokenAddress)
  const lpPoolTicketContract = contract('ticket', ERC20Abi, ticketAddress)
  const underlyingTokenFaucetContract = contract('tokenFaucet', TokenFaucetAbi, tokenFaucetAddress)

  const genericResponse = await batch(
    readProvider,
    underlyingTokenContract.decimals().totalSupply(),
    lpPoolTicketContract.totalSupply().decimals(),
    underlyingTokenFaucetContract.dripRatePerSecond(),
    dripTokenContract.balanceOf(tokenFaucetAddress).decimals()
  )

  const dripTokenDecimals = genericResponse.dripToken.decimals[0]
  const underlyingDecimals = genericResponse.underlyingToken.decimals[0]
  const ticketDecimals = genericResponse.ticket.decimals[0]

  const dripRatePerSecondUnformatted = genericResponse.tokenFaucet.dripRatePerSecond[0]
  const dripRatePerSecond = formatUnits(dripRatePerSecondUnformatted, dripTokenDecimals)
  const dripRatePerDayUnformatted = dripRatePerSecondUnformatted.mul(SECONDS_PER_DAY)
  const dripRatePerDay = formatUnits(dripRatePerDayUnformatted, dripTokenDecimals)

  const ticketTotalSupplyUnformatted = genericResponse.ticket.totalSupply[0]
  const underlyingTokenTotalSupplyUnformatted = genericResponse.underlyingToken.totalSupply[0]

  return {
    tokenFaucetData: {
      decimals: dripTokenDecimals,
      balance: formatUnits(genericResponse.dripToken.balanceOf[0], dripTokenDecimals),
      balanceUnformatted: genericResponse.dripToken.balanceOf[0],
      dripRatePerSecond,
      dripRatePerSecondUnformatted,
      dripRatePerDay,
      dripRatePerDayUnformatted
    },
    underlyingTokenData: {
      decimals: underlyingDecimals,
      totalSupply: formatUnits(underlyingTokenTotalSupplyUnformatted, underlyingDecimals),
      totalSupplyUnformatted: underlyingTokenTotalSupplyUnformatted
    },
    ticketsData: {
      decimals: ticketDecimals,
      totalSupply: formatUnits(ticketTotalSupplyUnformatted, ticketDecimals),
      totalSupplyUnformatted: ticketTotalSupplyUnformatted
    }
  }
}

const getUserLPChainData = async (
  readProvider,
  usersAddress,
  stakingPool,
  stakingPoolChainData
) => {
  const { prizePool, tokenFaucet, tokens } = stakingPool
  const { underlyingToken, ticket, tokenFaucetDripToken } = tokens

  const prizePoolAddress = prizePool.address
  const tokenFaucetAddress = tokenFaucet.address
  const underlyingTokenAddress = underlyingToken.address
  const ticketAddress = ticket.address
  const dripTokenAddress = tokenFaucetDripToken.address

  const dripTokenContract = contract('dripToken', ERC20Abi, dripTokenAddress)
  const underlyingTokenContract = contract('underlyingToken', ERC20Abi, underlyingTokenAddress)
  const lpPoolTicketContract = contract('ticket', ERC20Abi, ticketAddress)
  const underlyingTokenFaucetContract = contract('tokenFaucet', TokenFaucetAbi, tokenFaucetAddress)

  const usersResponse = await batch(
    readProvider,
    underlyingTokenContract.balanceOf(usersAddress).allowance(usersAddress, prizePoolAddress),
    lpPoolTicketContract.balanceOf(usersAddress),
    underlyingTokenFaucetContract.claim(usersAddress),
    dripTokenContract.balanceOf(usersAddress)
  )

  const dripTokenDecimals = stakingPoolChainData.tokenFaucetData.decimals
  const underlyingDecimals = stakingPoolChainData.underlyingTokenData.decimals
  const ticketDecimals = stakingPoolChainData.ticketsData.decimals

  const dripRatePerSecondUnformatted =
    stakingPoolChainData.tokenFaucetData.dripRatePerSecondUnformatted
  const dripRatePerDayUnformatted = dripRatePerSecondUnformatted.mul(SECONDS_PER_DAY)

  const ticketTotalSupplyUnformatted = stakingPoolChainData.ticketsData.totalSupplyUnformatted

  const usersTicketBalanceUnformatted = usersResponse.ticket.balanceOf[0]
  const ownershipPercentageScaled = ticketTotalSupplyUnformatted.isZero()
    ? ethers.constants.Zero
    : usersTicketBalanceUnformatted.mul(1000000).div(ticketTotalSupplyUnformatted)
  const usersDripPerDayUnformatted = dripRatePerDayUnformatted
    .mul(ownershipPercentageScaled)
    .div(1000000)

  const ownershipPercentage = formatUnits(ownershipPercentageScaled, 6)

  // TOKEN
  const tokenBalanceUnformatted = usersResponse.underlyingToken.balanceOf[0]
  const tokenBalance = {
    address: stakingPool.tokens.underlyingToken.address,
    amount: formatUnits(tokenBalanceUnformatted, underlyingDecimals),
    amountPretty: prettyNumber(tokenBalanceUnformatted, underlyingDecimals),
    amountUnformatted: tokenBalanceUnformatted,
    decimals: underlyingDecimals,
    hasBalance: tokenBalanceUnformatted.gt(0),
    name: stakingPool.tokens.underlyingToken.pair,
    symbol: stakingPool.tokens.underlyingToken.symbol
  }

  // TICKET
  const ticketBalance = {
    address: stakingPool.tokens.ticket.address,
    amount: formatUnits(usersTicketBalanceUnformatted, ticketDecimals),
    amountPretty: prettyNumber(usersTicketBalanceUnformatted, ticketDecimals),
    amountUnformatted: usersTicketBalanceUnformatted,
    decimals: ticketDecimals,
    hasBalance: usersTicketBalanceUnformatted.gt(0),
    name: stakingPool.tokens.ticket.name,
    symbol: stakingPool.tokens.ticket.symbol
  }

  return {
    balances: { token: tokenBalance, ticket: ticketBalance },
    userData: {
      tokenFaucet: {
        balance: formatUnits(usersResponse.dripToken.balanceOf[0], dripTokenDecimals),
        balanceUnformatted: usersResponse.dripToken.balanceOf[0]
      },
      underlyingToken: {
        balance: formatUnits(usersResponse.underlyingToken.balanceOf[0], underlyingDecimals),
        balanceUnformatted: usersResponse.underlyingToken.balanceOf[0],
        allowance: usersResponse.underlyingToken.allowance[0]
      },
      tickets: {
        balance: formatUnits(usersTicketBalanceUnformatted, ticketDecimals),
        balanceUnformatted: usersTicketBalanceUnformatted,
        ownershipPercentage
      },
      claimableBalance: formatUnits(usersResponse.tokenFaucet.claim[0], dripTokenDecimals),
      claimableBalanceUnformatted: usersResponse.tokenFaucet.claim[0],
      dripTokensPerDay: formatUnits(usersDripPerDayUnformatted, dripTokenDecimals),
      dripTokensPerDayUnformatted: usersDripPerDayUnformatted
    }
  }
}
