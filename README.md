# PoolTogether hooks

A collection of various useful hooks used across the PoolTogether applications.

## TODO:

1. jest tests

## How to use

1. `yarn add @pooltogether/utilities`
2. `import * as Utils from '@pooltogether/hooks'` OR `import { hookYouWantToUse } from '@pooltogether/hooks'`
3. Ensure you have all of the required environment variables imported into your project

## Requirements

Hooks that require other hooks also require their required hooks & environment variables.

### useOnboard

Hooks

- None
  Environment Variables
- `NEXT_JS_DOMAIN_NAME` ex. ``
- `NEXT_JS_INFURA_ID`
- `NEXT_JS_FORTMATIC_API_KEY`
- `NEXT_JS_PORTIS_API_KEY`
- `NEXT_JS_DEFAULT_ETHEREUM_NETWORK_NAME` ex. `1`
