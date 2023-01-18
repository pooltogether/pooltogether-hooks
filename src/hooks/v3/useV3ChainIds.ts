import { V3 } from '@pooltogether/utilities'

import { getAppEnvString } from '../../utils/getAppEnvString'

export const useV3ChainIds = () => {
  const appEnv = getAppEnvString()
  return V3.CHAIN_IDS[appEnv]
}
