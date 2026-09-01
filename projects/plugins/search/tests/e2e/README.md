[![Reports status](https://img.shields.io/website?down_color=grey&down_message=Dashboard%20offline&style=for-the-badge&label=E2E%20TEST%20REPORTS&up_color=green&up_message=see%20dashboard&url=https%3A%2F%2Fautomattic.github.io%2Fjetpack-e2e-reports%2F%23%2F)](https://automattic.github.io/jetpack-e2e-reports)

# Jetpack Search end-to-end tests

Automated end-to-end acceptance tests for Jetpack Search.

These tests are using the [e2e commons package](../../../../../tools/e2e-commons). Please refer to [their docs](../../../../../tools/e2e-commons/README.md) for more detailed information.

## Table of contents

- [Pre-requisites](#pre-requisites)
- [Environment setup](#environment-setup)
  - [Test Configuration](#test-configuration)
  - [Docker environment](#docker-environment)
  - [Tunnel](#local-tunnel)
- [Running tests](#running-tests)
  - [Test Data](#test-data)
- [Tests Architecture](#tests-architecture)
- [CI configuration](#ci-configuration)
- [Test reports](#test-reports)

## Pre-requisites

Make sure you install the monorepo first. `pnpm install` will install the project and the monorepo.

```shell
pnpm install
```

## Environment setup

### Build the plugin

The `build` npm script will build the Search package and the Jetpack plugin. 

```shell
pnpm build
```

### Test configuration

The tests rely on an encrypted configuration file, which is included in the [e2e commons package](../../../../../tools/e2e-commons) config folder as [`encrypted.enc`](../../../../../tools/e2e-commons/config/encrypted.enc). To be able to run tests - that file should be decrypted first.

To decrypt the config file (a8c only):

- Find a decryption key. Search secret store for "E2E Jetpack CONFIG_KEY"
- From the Jetpack Search E2E tests directory, run `CONFIG_KEY=YOUR_KEY pnpm config:decrypt`. This command should create a new file `local.cjs` in the Jetpack Search E2E tests config folder.

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

Playwright runs headless by default (i.e. browser is not visible). When developing or debugging tests it's usually useful to see what's happening. Playwright's [UI Mode](https://playwright.dev/docs/test-ui-mode) is a good option, it allows running individual or groups of tests, watching tests and has handy time travel feature. To launch it use the `--ui` flag:

```bash
pnpm test:run --ui
```

To run in debug mode, use the `--debug` flag. Debug mode uses a headed browser and opens the [Playwright inspector](https://playwright.dev/docs/inspector/).

```bash
pnpm test:run --debug
```

A simpler option is `headed` mode, which runs tests in your regular browser window:

```bash
pnpm test:run --headed
```

To run an individual test, use the direct path to the spec. This can be done in conjunction with any of the previously mentioned flags. For example:

```bash
pnpm test:run ./specs/search.test.ts
```

### Test Data

The search tests use predefined mock data located in `fixtures/test.ts`:
- `searchResultForTest1` - Mock response for "test1" queries (3 results)
- `searchResultForTest2` - Mock response for other queries (3 results) 

This mock data includes realistic search result structures with highlights, categories, tags, and WooCommerce product data.

## Tests Architecture

### Fixtures

The tests use custom Playwright fixtures to provide specialized functionality:

- **`fixtures/test.ts`** - Main test fixture that extends the base e2e-commons test with:
  - **Search API mocking** - Intercepts search API calls and returns mock data for consistent testing
  - **Test data** - Provides `searchResultForTest1` and `searchResultForTest2` mock search responses
  - **SearchUtils fixture** - Available in tests via `{ searchUtils }` parameter for enabling/disabling search, configuring settings, and managing search plan data

### Mocked Search API

Tests use mocked search API responses instead of real WordPress.com API calls:

- Query `"test1"` returns `searchResultForTest1` mock data
- All other queries return `searchResultForTest2` mock data  
- Supports sorting simulation (by date ascending/descending)
- Supports filtering simulation (by category and tag)

This ensures consistent, fast, and reliable test execution without external dependencies.

### Specs

Tests are in `/specs` folder using TypeScript (`.test.ts` files). Each test suite:

- Extends the custom search fixture (`fixtures/test.ts`) which provides search-specific utilities
- Uses the `searchUtils` fixture for WordPress configuration
- Automatically mocks search API calls for consistent results
- Tests search functionality including overlay behavior, sorting, filtering, and different result formats

Test suites use the `searchUtils` fixture instead of direct helper imports for better organization and type safety.

## CI Configuration

Both local runs and CI are sharing the same Docker based configuration.
See [workflows prefixed with e2e](../../../../../.github/workflows) for CI configuration.

## Test reports

Test reports are generated for every CI run and stored in [jetpack-e2e-reports](https://github.com/Automattic/jetpack-e2e-reports) repo. A dashboard displaying information about stored reports can be accessed at this link: [https://automattic.github.io/jetpack-e2e-reports](https://automattic.github.io/jetpack-e2e-reports)
