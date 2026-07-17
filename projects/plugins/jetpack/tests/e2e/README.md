[![Reports status](https://img.shields.io/website?down_color=grey&down_message=Dashboard%20offline&style=for-the-badge&label=E2E%20TEST%20REPORTS&up_color=green&up_message=see%20dashboard&url=https%3A%2F%2Fautomattic.github.io%2Fjetpack-e2e-reports%2F%23%2F)](https://automattic.github.io/jetpack-e2e-reports)

# Jetpack End-to-End tests

Automated end-to-end acceptance tests for the Jetpack plugin.

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

- Make sure you built Jetpack first `pnpm install && pnpm jetpack build` in the monorepo root directory should walk you through it. You can also refer to the monorepo documentation in how to build Jetpack.

```shell
# run in the monorepo root
pnpm install
pnpm jetpack build plugins/jetpack
```

## Environment setup

### Test configuration

Jetpack E2E tests relies on 2 encrypted configuration files, one included in this repo as [`config/encrypted.enc`](./config/encrypted.enc), which extends on a default one from e2e-commons. To be able to successfully create a local environment and run the tests both files need to be decrypted first.

To decrypt the config files (a8c only):

- Find a decryption key. Search secret store for "E2E Jetpack CONFIG_KEY"
- Go to the e2e directory you want to test: `cd projects/plugins/jetpack/tests/e2e`
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

Ensure your WP environment is running on `localhost:8889` before running tests.

```bash
# Run all tests
pnpm test:run

# Run specific test file
pnpm test:run ./specs/sync/sync.test.ts

# Run tests with UI mode (recommended for development and debugging)
pnpm test:run --ui

# Run tests matching a pattern
pnpm test:run --grep "connection"

# Debug specific test
pnpm test:run ./specs/forms/submission.test.ts --debug
```

For more options and detailed documentation, see [Playwright's official docs](https://playwright.dev/docs/running-tests).

## Tests Architecture

### Specs

Tests are kept in `/specs` folder. Every file represents a test suite, which is designed around specific feature under test.

Some specs require an active Jetpack connection. The connection is established automatically through global Playwright projects configured as prerequisites:
- `global authentication` - Authenticates both local WordPress user and WordPress.com user
- `connection setup` - Establishes Jetpack connection between local site and WordPress.com

These global projects run once before all tests and create a shared state that subsequent tests inherit. See the [e2e-commons README](../../../../../tools/e2e-commons/README.md) for more details on global projects and prerequisite setup.

### Fixtures

The tests should extend the base test fixture from e2e-commons (`tools/e2e-commons/fixtures/base-test.ts`) which provides pre-configured utilities for Jetpack testing. This base fixture extends Playwright's test with WordPress-specific utilities from `@wordpress/e2e-test-utils-playwright` and adds Jetpack-specific enhancements.

Available fixtures include:
- `admin` - WordPress admin page utilities (inherited from WordPress test utils)
- `editor` - EditorPage instance for block editor interactions
- `sidebar` - Sidebar instance for WordPress admin navigation
- `testUtils` - Worker-scoped utilities for WordPress CLI commands and API operations
- `pageUtils`, `requestUtils` - Additional utilities inherited from WordPress test utils

Import the test fixture in your specs:
```javascript
import { test } from '@automattic/_jetpack-e2e-commons/fixtures/base-test';
```

### Pages

The tests use the `PageObject` pattern to separate test logic from implementation. Page objects are abstractions around specific pages and page components.

**Important:** Avoid over-abstraction. Only create page objects for pages that are used across multiple tests. For single-use interactions, write the logic directly in your test spec to keep things simple and maintainable. Use your best judgment to balance reusability with simplicity.

Common pages are already available through fixtures:
- `admin` - WordPress admin page utilities
- `editor` - Block editor interactions
- `sidebar` - WordPress admin sidebar navigation

## CI Configuration

Both local runs and CI are sharing the same Docker based configuration.
See [workflows prefixed with e2e](../../../../../.github/workflows) for CI configuration.

## Test reports

Test reports are generated for every CI run and stored in [jetpack-e2e-reports](https://github.com/Automattic/jetpack-e2e-reports) repo. A dashboard displaying information about stored reports can be accessed at this link: [https://automattic.github.io/jetpack-e2e-reports](https://automattic.github.io/jetpack-e2e-reports)
