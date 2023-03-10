[![Reports status](https://img.shields.io/website?down_color=grey&down_message=Dashboard%20offline&style=for-the-badge&label=E2E%20TEST%20REPORTS&up_color=green&up_message=see%20dashboard&url=https%3A%2F%2Fautomattic.github.io%2Fjetpack-e2e-reports%2F%23%2F)](https://automattic.github.io/jetpack-e2e-reports)

# Jetpack Social End-to-End tests

Automated end-to-end acceptance tests for the Jetpack Social plugin.

These tests are using the [e2e commons package](../../../../../tools/e2e-commons). Please refer to [their docs](../../../../../tools/e2e-commons/README.md) for more detailed information.

## Table of contents

- [Pre-requisites](#pre-requisites)
- [Environment setup](#environment-setup)
  - [Test Configuration](#test-configuration)
  - [Docker environment](#docker-environment)
  - [Tunnel](#local-tunnel)
- [Running tests](#running-tests)
- [Tests Architecture](#tests-architecture)
- [CI configuration](#ci-configuration)
- [Test reports](#test-reports)

## Pre-requisites

Install dependencies and build Jetpack Social first.

```shell
# run in the monorepo root
pnpm install
pnpm jetpack build plugins/social
```

## Environment setup

### Test configuration

E2E tests rely on an encrypted configuration file, which is included in the [e2e commons package](../../../../../tools/e2e-commons) config folder as [`encrypted.enc`](../../../../../tools/e2e-commons/config/encrypted.enc). To be able to run tests - that file should be decrypted first.

To decrypt the config files (a8c only):

- Find a decryption key. Search secret store for "E2E Jetpack CONFIG_KEY"
- Run `CONFIG_KEY=YOUR_KEY pnpm config:decrypt`. This command should create a new file [`config/local.cjs`](./config/local.cjs)

### Docker environment

Tests expect to have a WordPress installation with Jetpack installed, accessible via a local tunnel.

To start the environment:

```shell
pnpm env:up
```

This will create the Docker environment and configure the WordPress installation. It will start one WordPress container and one database container. The WordPress installation is available at `localhost:8889`.

#### Local tunnel

To bypass the offline mode you will need your site to have a publicly accessible url that will proxy all requests to your locally running WordPress installation.
These tests use `localtunnel` library to expose `localhost:8889` via a public url.

To start a tunnel

```
pnpm tunnel:up
```

To stop the tunnel

```
pnpm tunnel:down
```

The tunnel url will be stored in a file so that it can be read by the tests and then reused by the tunnel script. See config files for details.

If you want a different url, use the `reset` command.

```
pnpm tunnel:reset
```

## Running tests

Once your target WP environment is running on `localhost:8889` you can run the tests.

Run all tests: `pnpm test:run`

Playwright runs headless by default (i.e. browser is not visible). However, sometimes it's useful to observe the browser while running tests. To see the browser window, and the running tests you can use the `--headed` flag:

```bash
pnpm test:run --headed
```

To run an individual test, use the direct path to the spec. For example:

```bash
pnpm test:run ./specs/connection.test.js
```

To run in debug mode, use the `--debug` flag. Debug mode uses a headed browser and opens the [Playwright inspector](https://playwright.dev/docs/inspector/).

```bash
pnpm test:run --debug
```

### Selecting tests to run

```bash
# One test file
pnpm test:run ./specs/connection.test.js

# All tests having 'connection' in their name
pnpm test:run connection

# Run only run tests matching a regular expression.
pnpm test:run --grep "connection"
pnpm test:run -g "connection"

# Run only run tests NOT matching a regular expression.
pnpm test:run --grep-invert "connection"
```

## Tests Architecture

### Specs

Tests are kept in `/specs` folder. Every file represents a test suite, which is designed around specific feature under test.
Every test suite is responsible for setting up the environment configuration for the suite. [e2e-commons prerequisites APIs](../../../../../tools/e2e-commons/env/prerequisites.js) provide an abstraction to set up the site the way is needed.

### Pages

The tests are using the `PageObject` pattern, which is a way to separate test logic from implementation. Page objects are basically abstractions around specific pages and page components.
Most common pages are already modeled in [e2e-commons pages module](../../../../../tools/e2e-commons/pages).

If you need to add a new page, please add it in the `pages` folder.
Each page should extend e2e-commons's [`WpPage`](../../../../../tools/e2e-commons/pages/wp-page.js) or [`PageActions`](../../../../../tools/e2e-commons/pages/page-actions.js).
`WpPage` should be extended by all page objects that represent full pages. Rule of thumb: if it has a URL it should extend `WpPage`. Otherwise, it's probably representing a page component (like a block) and should directly extend `PageActions`.

## CI Configuration

Both local runs and CI are sharing the same Docker based configuration.
See [workflows prefixed with e2e](../../../../../.github/workflows) for CI configuration.

## Test reports

Test reports are generated for every CI run. A dashboard displaying information about stored reports can be accessed at this link: [https://automattic.github.io/jetpack-e2e-reports](https://automattic.github.io/jetpack-e2e-reports)
