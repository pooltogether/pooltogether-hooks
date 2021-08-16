# PoolTogether hooks

A collection of various useful hooks used across the PoolTogether applications.

## NOTE

Make sure you keep `peerDependencies` and `devDependencies` versions in sync!

## How to use

1. `yarn add @pooltogether/utilities`
2. `import * as Hooks from '@pooltogether/hooks'` OR `import { hookYouWantToUse } from '@pooltogether/hooks'`
3. Ensure you call any required init functions early

## Local development

Local development works best with yalc
`yarn global add yalc`

In pooltogether-hooks:
`yarn start`

In the app you're importing pooltogether-hooks:
`yalc link @pooltogether/hooks`

When you save changes inside the hooks `src` folder, the package will rebuild and be pushed to all other projects that have run `yalc link @pooltogether/hooks`.

## TODO:

- jest tests
