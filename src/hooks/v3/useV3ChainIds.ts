import { V3 } from '../../constants'
import { getAppEnvString } from '../../utils/getAppEnvString'

export const useV3ChainIds = () => {
  const appEnv = getAppEnvString()
  return V3.CHAIN_IDS[appEnv]
}
