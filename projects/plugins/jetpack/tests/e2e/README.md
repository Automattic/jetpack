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

## Admin shell regression suite

`specs/admin-shell` is the acceptance suite for in-shell navigation (JETPACK-3406). It has its own config, `playwright.admin-shell.config.ts`, so it can run against any site with the shell on, without the Docker environment or the encrypted config. It runs in Chromium, Firefox and WebKit.

```bash
ADMIN_SHELL_URL=https://example.jurassic.ninja \
ADMIN_SHELL_USER=demo ADMIN_SHELL_PASSWORD=... \
ADMIN_SHELL_OFF_URL=https://other.jurassic.ninja \
ADMIN_SHELL_OFF_USER=demo ADMIN_SHELL_OFF_PASSWORD=... \
pnpm test:admin-shell
```

- `ADMIN_SHELL_URL` (default `http://localhost:8889`) must have `jetpack_admin_shell_enabled` on. Members marked `optional` in `helpers/admin-shell-helper.ts` need site setup, noted on each entry, and tests that use one skip where the site's admin menu lacks it. SEO, for example, shows only with the `seo-admin-ui` plan feature or the `rsm_jetpack_seo` filter, and with the `seo-tools` module on.
- `ADMIN_SHELL_OFF_URL` is optional: a site with the shell off, for the `shell off` smoke projects. Without it they are skipped.
- `ADMIN_SHELL_STANDALONE_URL` (with `ADMIN_SHELL_STANDALONE_USER` / `ADMIN_SHELL_STANDALONE_PASSWORD`) is optional: a site with the shell on and only standalone plugins, such as Backup, Social and VideoPress, without the Jetpack plugin (JETPACK-3419). It adds the `standalone` projects; without it there are none. Run it again after installing standalone plugins built against different Admin UI versions.
- Add `--project='shell on: chromium'` to run one browser.

Tests read shell state only through `readShell()` in `helpers/admin-shell-helper.ts`, which uses the `data-shell-page` / `data-shell-state` hooks. A document without the shell (shell off, or `?jetpack_admin_shell=0`) never has those hooks, so `readShell()` reads it from the `jetpack_page_<slug>` body class and that page's mount element; keep that path after the rewrite. `switchTo()` fails if a switch reloads the document, so tests that expect a full load click `menuLink()` instead.

In CI, the `Jetpack admin shell` entry in `.github/files/e2e-tests/e2e-matrix.js` runs it on PRs that touch the Jetpack plugin or any project it depends on (which covers `admin-ui` and every member), or the suite itself. `pnpm test:admin-shell:ci` (`bin/admin-shell-ci.sh`) runs it against the Docker site from `pnpm env:up`, reading the login from the decrypted config (`pnpm config:decrypt`). It activates the Forms and Podcast modules, then the `e2e-admin-shell` plugin, which keeps the site out of offline mode, stubs a WordPress.com connection (most members need one) and fails WordPress.com requests at once, and then the AI module, which needs that connection. It runs the shell-on projects, then sets the `e2e_admin_shell_off` option and runs the shell-off smoke, so the two runs differ only by the flag. The standalone projects don't run in CI.

Known bugs are `test.fail()` with a reason, so a fix shows up as an unexpected pass: remove the marker in the same PR. Intermittent bugs can't use `test.fail()`. Wrap those tests in `intermittentSpikeBug()`, which adds the `intermittent spike bug` annotation and the only retries in the config, so they report as flaky and anything else that fails intermittently still fails.

## CI Configuration

Both local runs and CI are sharing the same Docker based configuration.
See [workflows prefixed with e2e](../../../../../.github/workflows) for CI configuration.
