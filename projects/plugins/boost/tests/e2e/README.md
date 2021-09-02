# Jetpack Boost End-to-End tests

Automated end-to-end acceptance tests for the Jetpack Boost plugin.

**IMPORTANT** As there is not yet one single infrastructure and core package across plugins on the Jetpack Monorepo, the Jetpack Boost e2e framework and setup relies heavily on the Jetpack plugin e2e package and setup. So please familiarise yourself with the Jetpack e2e [documentation](../../../jetpack/tests/e2e/README.md).

## Boost specific information

- [Pre-requisites](#pre-requisites)
- [Getting started](#getting-started)

## Pre-requisites

* This readme assumes that `node`, `pnpm` and `docker` are already installed on your machine.
* Make sure you built Jetpack Boost first. `pnpm install && pnpx jetpack build plugin/boost` in the monorepo root directory should walk you through it. You can also refer to the Jetpack Boost [documentation](../../docs/DEVELOPEMENT_GUIDE.md) in how to build Jetpack Boost.
* Run ``pnpm install` from the Jetpack Boost e2e tests directory. This command will copy the [default config file](../../../jetpack/tests/e2e/config/default.js) from Jetpack plugin e2e framework into the Jetpack Boost config file as `local.js`. This file is not committed in the repo and allows avoiding duplication of configuration committed in repo. 

Jetpack Boost E2E tests also rely on an encrypted configuration file, which is included in the Jetpack plugin e2e tests config folder repo as [`encrypted.enc`](../../../jetpack/tests/e2e/config/encrypted.enc). To be able to run tests - that file should be decrypted first.

To decrypt the config file (a8c only):

- Find a decryption key. Search secret store for "E2E Jetpack CONFIG_KEY"
- From the Jetpack Boost e2e tests directory, run `CONFIG_KEY=YOUR_KEY pnpm test-decrypt-config`. This command should create a new file  [`local-test.js`](./config/local-test.js)

## Getting Started

Typically, the workflow is the same as the one described in the Jetpack e2e [documentation](../../../jetpack/tests/e2e/README.md). You can follow the same workflow but running the commands inside the Jetpack Boosts e2e tests folder.

However, Boost has some shortcuts to get the environment started and run all the tests by running the following commands from the root of the Jetpack Boost repository:

- `pnpm test-e2e:start` - This will command will start the e2e testing environment and the tunnel.
- `pnpm test-e2e:run` - This command will run the e2e tests.
- `pnpm test-e2e:stop` - This command stop the e2e testing environment.

