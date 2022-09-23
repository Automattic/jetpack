# Jetpack Boost End-to-End tests

Automated end-to-end acceptance tests for the Jetpack Boost plugin.

**Note**: The Jetpack Boost E2E framework and setup relies heavily on the [e2e commons package](../../../../../tools/e2e-commons). So please familiarise yourself with it first. Also, you might want to review the Jetpack E2E [documentation](../../../jetpack/tests/e2e/README.md) which does contains a lot of information regarding the E2E framework and setup which is not repeated here for the sake of brevity.

## Boost specific information

- [Pre-requisites](#pre-requisites)
- [Getting started](#getting-started)

## Pre-requisites

- This readme assumes that `node`, `pnpm` and `docker` are already installed on your machine.
- Make sure you built Jetpack Boost first. `pnpm install && pnpm jetpack build plugins/boost` in the monorepo root directory should walk you through it. You can also refer to the Jetpack Boost [documentation](../../docs/DEVELOPEMENT_GUIDE.md) in how to build Jetpack Boost.
- Run `pnpm install` from the Jetpack Boost E2E tests directory. This command install all the required dependencies

Jetpack Boost E2E tests also rely on an encrypted configuration file, which is included in the [e2e commons package](../../../../../tools/e2e-commons) config folder as [`encrypted.enc`](../../../../../tools/e2e-commons/config/encrypted.enc). To be able to run tests - that file should be decrypted first.

To decrypt the config file (a8c only):

- Find a decryption key. Search secret store for "E2E Jetpack CONFIG_KEY"
- From the Jetpack Boost E2E tests directory, run `CONFIG_KEY=YOUR_KEY pnpm config:decrypt`. This command should create a new file `local.cjs` in the Jetpack Boost E2E tests config folder.

## Getting Started

Typically, the workflow is the same as the one described in the Jetpack E2E [documentation](../../../jetpack/tests/e2e/README.md). You can follow the same workflow but running the commands inside the Jetpack Boost E2E tests folder.

However,below is a quick reminder of the critical steps to run the tests.

From the root of the repo (this has to be done only once or when pulling new changes):

1. run `pnpm install` - This command will install the monorepo NPM dependencies.
2. run `jetpack build plugins/jetpack` - This command will install Jetpack NPM and Composer dependencies as well as building the asset files.
3. run `jetpack build plugins/boost` - This command will install Jetpack Boost NPM and Composer dependencies as well as building the asset files.

From the `projects/plugins/boost/tests/e2e` folder:

4. run `pnpm install` - This will install the Jetpack Boost E2E tests NPM dependencies.
5. run `pnpm run config:decrypt` - This command will decrypt the config and create/overwrite the local test config file.
6. run `pnpm run env:up && pnpm run tunnel:up` - This command will start the e2e testing environment and the tunnel.
7. run `pnpm run test:run` - This command will run the e2e tests.

However, Boost has some shortcuts to get the environment started and run all the tests by running the following commands from the root of the Jetpack Boost folder:

- `pnpm test-e2e:decrypt-config` - This command will decrypt the config and create/overwrite the local test config file.
- `pnpm test-e2e:start` - This command will start the e2e testing environment and the tunnel.
- `pnpm test-e2e:run` - This command will run the e2e tests.
- `pnpm test-e2e:stop` - This command will stop the e2e testing environment.
