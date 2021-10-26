
# Jetpack e2e commons

This project is intended to be used as a dependency by other e2e tests projects for Jetpack plugins.
There are no tests defined here.

With this project you'll be able to:
- consistently launch and configure a Jetpack environment
- create test results, send Slack notifications
- use the most common pages modeled using [Page objects model](https://playwright.dev/docs/test-pom).
- use the most common flows (login, connect Jetpack)

## Prerequisites

You'll need `node` and `pnpm` installed, and if you're planning to run the tests against a local dev environment, `docker` is also required.

## Under the hood

The following test specific tools are used:

- [Playwright](https://playwright.dev) for browser automation
- [Jest](https://jestjs.io) for test management and test runner
- [Allure](https://docs.qameta.io/allure/) as test reporter

## Getting started

### Add dependencies

Add this project as a dev dependency in your e2e tests project:

```shell
pnpm add -D path/to/tools/e2e-commons
```

Optional, you can also add a `preinstall` script to install this project.

```shell
"preinstall": "pnpm --prefix path/to/tools/e2e-commons install"
```

### Create a simple test

Create 

### Run your test against a local environment

#### Run the local test environment

1. Build Jetpack

```shell
pnpm jetpack build plugins/jetpack
```

2. Build your plugin

Assuming you're building tests for a standalone plugin, don't forget to also build that.

3. Start the local environment

```shell
## Decrypt default config file
pnpm 

## Start and the Docker environment and configure
pnpm e2e-env start

## Create a tunnel
pnpm tunnel on 
```

#### Run the test

```shell
TEST_SITE=mySite pnpm jest
```

### Run your test against an external preconfigured site

```shell
TEST_SITE=mySite pnpm jest
```
