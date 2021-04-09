# Jetpack End-to-End tests

Automated end-to-end acceptance tests for the Jetpack plugin.

## Table of contents

- [Pre-requisites](#pre-requisites)
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
* Make sure you built Jetpack first. `yarn build` in the tests parent directory should do it. You can also refer to the monorepo documentation in how to build Jetpack.

### Configuration

#### Test Configuration

Jetpack E2E tests relies on encrypted configuration file, which is included in this repo as [`encrypted.enc`](./config/encrypted.enc). To be able to run tests - that file should be decrypted first.

To decrypt the config file (a8c only):

- Find a decryption key. Search secret store for "E2E Jetpack CONFIG_KEY"
- Run `CONFIG_KEY=YOUR_KEY yarn test-decrypt-config`. This command should create a new file  [`local-test.js`](./config/local-test.js)

#### WP Site Configuration

Test environment is a bit complex (It's Jetpack, you know ;)). Tests expect to have WP installation with installed Jetpack accessible via a local tunnel. Required environment could easily be created via core's `wp-env` node package.

`wp-env` is a wrapper around `docker-compose` that makes it pretty easy to get up and running with E2E tests (and local development as well!). We use a wrapper around `wp-env` that updates some options to make `wp-env` containers to work with Jetpack tests. To set up tests environment:

1. Make sure that docker is installed locally
2. Run `./bin/env.sh start` to start a `wp-env` containers. It will start 2 wordpress installation (we would use only 1 though) & wp-cli container.

#### Environment variables

* `HEADLESS` - default `true`. Whether to run tests in a headless mode or not.
* `E2E_DEBUG` - default `false`. Will log debug information into console. Also forces browser headfull mode, any value for the above `HEADLESS` var will be ignored.
* `PAUSE_ON_FAILURE` - default `false`. Combined with `E2E_DEBUG=true` will pause the test execution when an error occurs and will open Playwright Inspector.

## Running tests

Once you target WP environment is running on `localhost:8889` you can run the tests.

Run all tests: `yarn test-e2e`

Playwright runs headless by default (i.e. browser is not visible). However, sometimes it's useful to observe the browser while running tests. To see the browser window, and the running tests you can pass `HEADLESS=false` as follows:

```bash
HEADLESS=false yarn test-e2e
```

To run an individual test, use the direct path to the spec. For example:

```bash
yarn test-e2e ./specs/dummy.test.js
```

For the best experience while debugging and/or writing new tests `E2E_DEBUG` constant is recommended to use.

```bash
E2E_DEBUG=true yarn test-e2e ./specs/some.test.js -t 'Test name'
```

### Selecting tests to run

```bash
# One spec (test file)
yarn test-e2e ./specs/some.test.js

# One test from a test file
yarn test-e2e ./specs/some.test.js -t 'Test name'

# All blocks tests
yarn test-e2e --testNamePattern=blocks

# Only mailchimp test(s)
yarn test-e2e --testNamePattern=mailchimp

# All tests except the updater one(s)
yarn test-e2e --testPathIgnorePatterns=updater

```

## Writing tests

We use the following tools to write e2e tests:

- [Playwright](https://github.com/microsoft/playwright) – a Node library which provides a high-level API to control the browser over the DevTools Protocol
- [jest](https://jestjs.io/) – The test library, with `jest-circus` as test runner.

## Tests Architecture

Tests are kept in `/specs` folder. Every file represents a test suite, which is designed around specific feature under test. Most of the tests rely on an active Jetpack connection, so we connect a site before running the actual test suite. Its logic can be found in the [`test-setup#maybePreConnect`](lib/env/test-setup.js) function. For test suites where pre-connection is not needed, it can be disabled by setting `SKIP_CONNECT` env var to false. Check [`connection.test.js`](./specs/connection.test.js) for example use.

The tests are using the `PageObject` pattern, which is a way to separate test logic from implementation. Page objects are basically abstractions around specific pages and page components. 
There are two base classes that should be extended by page objects: [`WpPage`](lib/pages/wp-page.js) and [`PageActions`](lib/pages/page-actions.js) class.

* `WpPage` implements common page methods, like `init` - static method that initializes a page object and checks the displayed page is the expected one and `visit` - method that navigates to a page URL and then performs all the `init` checks.
* `PageActions` takes care of all the common lower level page actions, like click on elements, filling forms, etc. Basically all interactions with a browser page should go through this class's methods. 

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

Both local runs and CI sharing the same `wp-env` based configuration

## Functionality plugins

Tests rely on functionality plugins that provide some additional functionality, provide shortcuts, etc.

### e2e-plan-data-interceptor.php

The purpose of this plugin is to provide a way to `mock` Jetpack plan, for cases when we test functionality that does not directly use paid services. Great example of this purpose is a paid Gutenberg blocks.
