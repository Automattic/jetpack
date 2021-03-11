# Jetpack End to End tests

Automated end-to-end acceptance tests for the Jetpack plugin.

## Table of contents

- [Pre-requisites](#pre-requisites)
	- [Install dependencies](#install-dependencies)
	- [Configuration](#configuration)
		- [Test Configuration](#test-configuration)
		- [WP Site Configuration](#wp-site-configuration)
		- [Environment Variables](#environment-variables)
- [Running tests](#running-tests)
- [Writing tests](#writing-tests)
- [Tests Architecture](#tests-architecture)
- [CI configuration](#ci-configuration)

## Pre-requisites

* This readme assumes that `node`, `yarn` and `docker` are already installed on your machine.
* Make sure you built Jetpack first. `yarn build` in the tests parent directory should do it. You can also refer to the monorepo's documentation in how to build Jetpack.

### Configuration

#### Test Configuration

Jetpack E2E tests relies on encrypted configuration file, which is included in this repo as [`encrypted.enc`](./config/encrypted.enc). To be able to run tests - that file should be decrypted first.

To decrypt the config file (a8c only):

- Find a decryption key. Search secret store for "E2E Jetpack CONFIG_KEY"
- Run `CONFIG_KEY=YOUR_KEY yarn test-decrypt-config`. This command should create a new file  [`local-test.js`](./config/local-test.js)

#### WP Site Configuration

Test environment is a bit complex (It's Jetpack, you know ;)). Tests expect to have WP installation with installed Jetpack accessible via a local tunnel. Required environment could easily be created via core's `wp-env` node package.

`wp-env` is a wrapper around `docker-compose` that makes it pretty easy to get up and running with E2E tests (and local development as well!). We use a wrapper around `wp-env` that updates some options to make `wp-env` containers to work with Jetpack tests. To setup tests environment:

1. Make sure that docker is installed locally
2. Run `./bin/env.sh start` to start a `wp-env` containers. It will start 2 wordpress installation (we would use only 1 though) & wp-cli container.

#### Environment variables

* `HEADLESS` - default `true`. Whether to run tests in a headless mode or not.
* `E2E_DEBUG` - default `false`. Will log debug information into console. Also forces browser headfull mode, any value for the above `HEADLESS` var will be ignored.
* `PAUSE_ON_FAILURE` - default `false`. Combined with `E2E_DEBUG=true` will pause the test execution when an error occurs and will open Playwright Inspector.

## Running tests

Once you target WP environment is running on `localhost:8889` you can run the tests.

Run all tests: `yarn test-e2e`

Playwright runs headless by default (i.e. browser is not visible). However, sometimes it's useful to observe the browser while running tests. To see the browser window and the running tests you can pass `HEADLESS=false` as follows:

```bash
HEADLESS=false yarn test-e2e
```

To run an individual test, use the direct path to the spec. For example:

```bash
yarn test-e2e ./specs/dummy.test.js
```

For the best experience while debugging and/or writing new tests `E2E_DEBUG` constant is recommended to use. Also Jest's `-t` argument could be used to run single test from the test suite(file)

```bash
E2E_DEBUG=true yarn test-e2e ./specs/some.test.js -t 'Test name'
```

## Writing tests

We use the following tools to write e2e tests:

- [Playwright](https://github.com/microsoft/playwright) – a Node library which provides a high-level API to control Chrome or Chromium over the DevTools Protocol
- [jest-playwright](https://github.com/playwright-community/jest-playwright) – provides all required configuration to run tests using Playwright

Tests are kept in `/specs` folder. Every file represents a test suite, which is designed around specific feature under test. Most of the tests rely on an active Jetpack Connection, so we connect a site before running the actual test suite. Its logic can be found in the [`test-setup#maybePreConnect`](lib/env/test-setup.js) function. For test suites where pre-connection is not needed, it can be disabled by setting `SKIP_CONNECT` env var to false. Check [`connection.test.js`](./specs/connection.test.js) for example use.

## Tests Architecture

The tests are using the `PageObject` pattern, which is a way to separate test logic from implementation. Page objects are basically abstractions around specific pages and page components. All the pages are extending the [`Page`](./lib/pages/page.js) class, and don't really have any specific requirements, except maybe the way how page constructors are designed. `expectedSelector` is a CSS selector that identifies the specific page/component. Make sure to pass `page` instance together with the `expectedSelector` to the `super` call as follows:

```js
constructor( page ) {
  const expectedSelector = '.plan-features__table button.is-personal-plan:not([disabled])';
  super( page, { expectedSelector } );
}
```

Since most of the Playwright functionality is `async`, and JavaScript constructors are not - we should initialize pages with `init()` static method: `await BlockEditorPage.init( page )` to make sure we would wait for `expectedSelector` to become visible.

## CI Configuration

Both local runs and CI sharing the same `wp-env` based configuration

## Functionality plugins

Tests rely on functionality plugins that provide some additional functionality, provide shortcuts, etc.

### e2e-plan-data-interceptor.php

The purpose of this plugin is to provide a way to `mock` Jetpack plan, for cases when we test functionality that does not directly use paid services. Great example of this purpose is a paid Gutenberg blocks.
