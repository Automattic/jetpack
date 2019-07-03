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
  - [How to run tests](#how-to-run-tests)
- [Writing tests](#writing-tests)
- [Tests Architecture](#tests-architecture)
- [CI configuration](#ci-configuration)

## Pre-requisites

### Install dependencies

This readme assumes that node and yarn already installed on your machine.

```bash
yarn
```

### Configuration

#### Test Configuration

Gutenpack E2E tests relies on encrypted configuration file, which is included in this repo as [`encrypted.enc`](./config/encrypted.enc). To be able to run tests - that file should be decrypted first.

To decrypt the config file (a8c only):

- Find a decryption key. Search the `SS` for "E2E Gutenpack CONFIG_KEY"
- Run `CONFIG_KEY=YOUR_KEY yarn test-decrypt-config`. This command should create a new file  [`local-test.js`](./config/local-test.js)

#### WP Site Configuration

The tests require a WP installation with installed Jetpack, and which could be connected i.e. the site has a public domain. Ngrok-ed local site or a fresh JN site will work perfectly. Since Jetpack plan is required for some of the blocks, there are few states in which test site could be:

1. A fresh site with not connected Jetpack which does not have any purchased plan
2. Jetpack connected site with purchased Professional _sandboxed_ plan. More on sandboxed plans: PCYsg-IA-p2

By default, tests expect that your site is accessible on `localhost`, and its admin credentials are `wordpress` / `wordpress`. All these values could be overridden by environment variables that could be passed along with the test execution command. The default values are defined in default (non-encrypted) config file: [`./config/default.js`](./config/default.js)

#### Environment variables

These environmental variables could be used to re-define default WP site related values:

- `export WP_BASE_URL={your site URL}`
- `export WP_USERNAME={your site Admin username}`
- `export WP_PASSWORD={your site Admin password}`

`PUPPETEER_HEADLESS` - is used to run test visually. Default is `true`
`E2E_DEBUG` - Could be used to help with tests development / debugging. For now, it's used to pause the test execution on test error or failure

## Running tests

### How to run tests

You can run the e2e tests locally using this command:

```bash
yarn test-e2e
```

Puppeteer runs headless by default (i.e. browser is not visible). However, sometimes it's useful to observe the browser while running tests. To see the browser window and the running tests you can pass `PUPPETEER_HEADLESS=false` as follows:

```bash
PUPPETEER_HEADLESS=false npm run test-e2e
```

To run an individual test, use the direct path to the spec. For example:

```bash
npm run test-e2e ./tests/e2e/specs/dummy.test.js
```

You can also provide the base URL, Test username and Test password like this:

```bash
WP_BASE_URL="URL" WP_USERNAME="your_login" WP_PASSWORD="your_password" npm run test-e2e
```

## Writing tests

We use the following tools to write e2e tests:

- [Puppeteer](https://github.com/GoogleChrome/puppeteer) – a Node library which provides a high-level API to control Chrome or Chromium over the DevTools Protocol
- [jest-puppeteer](https://github.com/smooth-code/jest-puppeteer) – provides all required configuration to run tests using Puppeteer
- [expect-puppeteer](https://github.com/smooth-code/jest-puppeteer/tree/master/packages/expect-puppeteer) – assertion library for Puppeteer

Tests are kept in `tests/e2e/specs` folder.

The following packages are being used to write tests:

- `e2e-test-utils` - End-To-End (E2E) test utils for WordPress. You can find the full list of utils [here](https://github.com/WordPress/gutenberg/tree/master/packages/e2e-test-utils).

## Tests Architecture

The tests are using the PageObject pattern, which is a way to separate test logic from implementation. Page objects are basically abstractions around specific pages and page components. All the pages extending the [`Page`](./lib/pages/page.js) class, and don't really have any specific requirements, except maybe the way how page constructors are designed. `expectedSelector` is a CSS selector that identifies the specific page/component. Make sure to pass `page` instance together with the `expectedSelector` to the `super` call as follows:

```js
constructor( page ) {
  const expectedSelector = '.plan-features__table button.is-personal-plan:not([disabled])';
  super( page, { expectedSelector } );
}
```

Since most of Puppeteer functionality is `async`, and JavaScript constructors are not - we should initialize pages with `init()` static method: `await BlockEditorPage.init( page )` to make sure we would wait for `expectedSelector` to become visible.

## CI Configuration

The heart of CI infrastructure is a [`setup-e2e-travis.sh`](./bin/setup-e2e-travis.sh) script. This script doing a few things:

- Installs and launches `ngrok` which is tunneling `localhost:80` to the public domain
- Installs and sets-up the `nginx`
- Installs and sets-up WordPress installation
- Activates Jetpack plugin

You disable e2e tests in Travis by setting Travis env variable `RUN_E2E` to false (or just removing it completely) in on project's [settings page](https://travis-ci.org/Automattic/jetpack/settings). To re-enable them - just set it to `true`
