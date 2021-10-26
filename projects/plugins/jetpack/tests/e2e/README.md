[![Reports status](https://img.shields.io/website?down_color=grey&down_message=Dashboard%20offline&style=for-the-badge&label=E2E%20TEST%20REPORTS&up_color=green&up_message=see%20dashboard&url=https%3A%2F%2Fautomattic.github.io%2Fjetpack-e2e-reports%2F%23%2F)](https://automattic.github.io/jetpack-e2e-reports)

# Jetpack End-to-End tests

Automated end-to-end acceptance tests for the Jetpack plugin.

These tests are using the [e2e commons package](../../../../../tools/e2e-commons). For brevity, this doc will not repeat setup information inherited from e2e-commons.

## Table of contents

- [Pre-requisites](#pre-requisites)
- [Environment setup](#environment-setup)
	- [Test Configuration](#test-configuration)
	- [WP Site Configuration](#wp-site-configuration)
	- [Tunnel](#local-tunnel)
	- [Environment Variables](#environment-variables)
- [Running tests](#running-tests)
- [Writing tests](#writing-tests)
- [Tests Architecture](#tests-architecture)
- [CI configuration](#ci-configuration)
- [Test reports](#test-reports)

## Pre-requisites

- This readme assumes that `node`, `pnpm` and `docker` are already installed on your machine.
- Make sure you built Jetpack first. `pnpm install && pnpx jetpack build` in the monorepo root directory should walk you through it. You can also refer to the monorepo documentation in how to build Jetpack.

## Environment setup

### Test Configuration

Jetpack E2E tests relies on encrypted configuration file, which is included in this repo as [`encrypted.enc`](./config/encrypted.enc). To be able to run tests - that file should be decrypted first.

To decrypt the config file (a8c only):

- Find a decryption key. Search secret store for "E2E Jetpack CONFIG_KEY"
- Run `CONFIG_KEY=YOUR_KEY pnpm test-decrypt-config`. This command should create a new file [`local-test.js`](./config/local-test.js)

### WP Site Configuration

Test environment is a bit complex (It's Jetpack, you know ;)). Tests expect to have WP installation with installed Jetpack accessible via a local tunnel. Required environment could easily be created using Jetpack's Docker infrastructure.

To set up tests environment:

1. Make sure that Docker is installed locally
2. Run `pnpm env-start` to start a container. It will start one WordPress container and a DB container.

### Local tunnel

To bypass the offline mode you will need your site to have a publicly accessible url that will proxy all requests to your locally running WordPress installation.
These tests use `localtunnel` library to expose localhost:8889 via a public url.

To start a tunnel:

```
pnpm tunnel-on
```

To stop the tunnel:

```
pnpm tunnel-off
```

The tunnel url will be stored in a file so that it can be read by the tests and then reused by the tunnel script. See config files for details. If you want a different url, simply delete the file or update its content.

### Environment variables

- `HEADLESS` - default `true`. Whether to run tests in a headless mode or not.
- `E2E_DEBUG` - default `false`. Will log debug information into console. Also forces browser headfull mode, any value for the above `HEADLESS` var will be ignored.
- `PAUSE_ON_FAILURE` - default `false`. Combined with `E2E_DEBUG=true` will pause the test execution when an error occurs and will open Playwright Inspector.

## Running tests

Once your target WP environment is running on `localhost:8889` you can run the tests.

Run all tests: `pnpm test-e2e`

Playwright runs headless by default (i.e. browser is not visible). However, sometimes it's useful to observe the browser while running tests. To see the browser window, and the running tests you can pass `HEADLESS=false` as follows:

```bash
HEADLESS=false pnpm test-e2e
```

To run an individual test, use the direct path to the spec. For example:

```bash
pnpm test-e2e -- ./specs/dummy.test.js
```

For the best experience while debugging and/or writing new tests `E2E_DEBUG` constant is recommended to use.

```bash
E2E_DEBUG=true pnpm test-e2e -- ./specs/some.test.js -t 'Test name'
```

### Selecting tests to run

```bash
# One spec (test file)
pnpm test-e2e -- ./specs/some.test.js

# One test from a test file
pnpm test-e2e -- ./specs/some.test.js -t 'Test name'

# All tests having 'blocks' in their name
pnpm test-e2e -- --testNamePattern=blocks

# All tests except the updater one(s)
pnpm test-e2e -- --testPathIgnorePatterns=updater

# Filter by groups - run all tests in 'post-connection' group
pnpm test-e2e -- --group=post-connection

```

## Writing tests

We use the following tools to write e2e tests:

- [Playwright](https://github.com/microsoft/playwright) – a Node library which provides a high-level API to control the browser over the DevTools Protocol
- [jest](https://jestjs.io/) – The test library, with `jest-circus` as test runner.

## Tests Architecture

Tests are kept in `/specs` folder. Every file represents a test suite, which is designed around specific feature under test.
Every test suite is responsible for setting up the environment configuration for the suite. Some specs require an active Connection, some do not. Prerequisites APIs provide an abstraction to set up the site the way is needed.
Its logic can be found in the [`jetpack-connect.js`](../../../../../tools/e2e-commons/flows/jetpack-connect.js).

The tests are using the `PageObject` pattern, which is a way to separate test logic from implementation. Page objects are basically abstractions around specific pages and page components.
There are two base classes that should be extended by page objects: [`WpPage`](../../../../../tools/e2e-commons/pages/wp-page.js) and [`PageActions`](../../../../../tools/e2e-commons/pages/page-actions.js) class.

- `WpPage` implements common page methods, like `init` - static method that initializes a page object and checks the displayed page is the expected one and `visit` - method that navigates to a page URL and then performs all the `init` checks.
- `PageActions` takes care of all the common lower level page actions, like click on elements, filling forms, etc. Basically all interactions with a browser page should go through this class's methods.

`WpPage` extends `PageActions`.
`WpPage` should be extended by all page objects that represent full pages. Rule of thumb: if it has a URL it should extend WpPage. Otherwise, it's probably representing a page component (like a block) and should directly extend `PageActions`.

Since most of the Playwright functionality is `async`, and JavaScript constructors are not - we should initialize pages with `init()` static method: `await BlockEditorPage.init( page )` to make sure we would wait for `expectedSelectors` checks.
Make sure you pass these selectors in a page constructor to the `super` constructor by using the `expectedSelectors` argument. This expects an array of strings, so you can pass multiple selectors in case you want to check more elements on the page.

```js
constructor( page ) {
	super( page, { expectedSelectors: [ '.selector_1', '#selector_2' ] } );
}
```

## CI Configuration

Both local runs and CI are sharing the same Docker based configuration

## Functionality plugins

Tests rely on functionality plugins that provide some additional functionality, provide shortcuts, etc.

### e2e-plan-data-interceptor.php

The purpose of this plugin is to provide a way to `mock` Jetpack plan, for cases when we test functionality that does not directly use paid services. Great example of this purpose is a paid Gutenberg blocks.

## Test reports

Test reports are generated for every CI run and stored in [jetpack-e2e-reports](https://github.com/Automattic/jetpack-e2e-reports) repo. A dashboard displaying information about stored reports can be accessed at this link: [https://automattic.github.io/jetpack-e2e-reports](https://automattic.github.io/jetpack-e2e-reports)
