import useCoingeckoTokenData from './useCoingeckoTokenData'

const TOKEN_IMAGES_BY_ADDRESS = {
  '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48':
    'https://assets.coingecko.com/coins/images/6319/small/USD_Coin_icon.png?1547042389',
  '0x2260fac5e5542a773aa44fbcfedf7c193bc2c599':
    'https://assets.coingecko.com/coins/images/7598/small/wrapped_bitcoin_wbtc.png?1548822744',
  '0x06f65b8cfcb13a9fe37d836fe9708da38ecb29b2':
    'https://assets.coingecko.com/coins/images/11521/small/FAME.png?1590622461',
  '0x1494ca1f11d487c2bbe4543e90080aeba4ba3c2b':
    'https://assets.coingecko.com/coins/images/12465/small/defi_pulse_index_set.png',
  '0x1f9840a85d5af5bf1d1762f925bdaddc4201f984':
    'https://assets.coingecko.com/coins/images/12504/small/uniswap-uni.png?1600306604',
  '0x2b591e99afe9f32eaa6214f7b7629768c40eeb39':
    'https://assets.coingecko.com/coins/images/10103/small/HEX-logo.png?1575942673',
  '0x429881672b9ae42b8eba0e26cd9c73711b891ca5':
    'https://assets.coingecko.com/coins/images/12435/small/pickle_finance_logo.jpg?1599817746',
  '0x5dbcf33d8c2e976c6b560249878e6f1491bca25c':
    'https://assets.coingecko.com/coins/images/12210/small/yUSD.png?1600166557',
  '0x6e36556b3ee5aa28def2a8ec3dae30ec2b208739':
    'https://assets.coingecko.com/coins/images/12380/small/build.PNG?1599463828',
  '0x7865af71cf0b288b4e7f654f4f7851eb46a2b7f8':
    'https://assets.coingecko.com/coins/images/7383/small/2x9veCp.png?1598409975',
  '0x8ba6dcc667d3ff64c1a2123ce72ff5f0199e5315':
    'https://assets.coingecko.com/coins/images/10972/small/ALEX.png?1586742545',
  '0xa0246c9032bc3a600820415ae600c6388619a14d':
    'https://assets.coingecko.com/coins/images/12304/small/Harvest.png?1599007988',
  '0xc00e94cb662c3520282e6f5717214004a7f26888':
    'https://assets.coingecko.com/coins/images/10775/small/COMP.png?1592625425',
  '0xc011a73ee8576fb46f5e1c5751ca3b9fe0af2a6f':
    'https://assets.coingecko.com/coins/images/3406/small/SNX.png?1598631139',
  '0xd533a949740bb3306d119cc777fa900ba034cd52':
    'https://assets.coingecko.com/coins/images/12124/small/Curve.png?1597369484',
  '0xe2f2a5c287993345a840db3b0845fbc70f5935a5':
    'https://assets.coingecko.com/coins/images/11576/small/mStable_USD.png?1595591803',
  '0xa91ac63d040deb1b7a5e4d4134ad23eb0ba07e14':
    'https://assets.coingecko.com/coins/images/12478/small/Bella.png?1602230054',
  '0x08d32b0da63e2c3bcf8019c9c5d849d7a9d791e6':
    'https://assets.coingecko.com/coins/images/850/small/dentacoin.png?1547034647',
  '0x6b3595068778dd592e39a122f4f5a5cf09c90fe2':
    'https://assets.coingecko.com/coins/images/12271/small/sushi.jpg?1598623048',
  '0xd291e7a03283640fdc51b121ac401383a46cc623':
    'https://assets.coingecko.com/coins/images/12900/small/rgt_logo.png?1603340632'
}

const useCoingeckoTokenImage = (chainId, address) => {
  const formattedAddress = address?.toLowerCase()
  const { data, isFetched, isFetching } = useCoingeckoTokenData(chainId, formattedAddress)

  const hardcodedImageUrl = TOKEN_IMAGES_BY_ADDRESS[formattedAddress]
  if (hardcodedImageUrl) {
    return {
      data: hardcodedImageUrl,
      isFetched: true,
      isFetching: false
    }
  }

  if (isFetched && data && !data.error) {
    return {
      data: data.image.small,
      isFetched: true,
      isFetching: false
    }
  }

  return {
    data: null,
    isFetched,
    isFetching
  }
}

export default useCoingeckoTokenImage
