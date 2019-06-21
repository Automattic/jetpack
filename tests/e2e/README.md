# Jetpack End to End tests

Automated end-to-end acceptance tests for Jetpack plugin.

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
- in your terminal run `export CONFIG_KEY=YOUR_KEY`
- Run `yarn test-decrypt-config`. This command should create a new file  [`local-test.js`](./config/local-test.js)

#### WP Site Configuration

The tests relies on utility functions of [`e2e-test-utils`](https://github.com/WordPress/gutenberg/tree/master/packages/e2e-test-utils) package. Some of these functions related to navigation and login (such as `loginUser()`, `visitAdminPage()` etc) relies on environment variables defined in [`setup.js`](./lib/setup.js) file to specify base URL, Admin user details. To start: create an Admin user on the site and set its username and password:

- username: `wordpress`
- password: `wordpress`

Specify base URL and Test user details using environment variables.

#### Environment variables

Set environmental variables as follows:

- `export WP_BASE_URL={your site URL}`
- `export WP_USERNAME={your Test user username}`
- `export WP_PASSWORD={your Test user password}`

## Running tests

### How to run tests

You can run the e2e tests locally using this command:

```bash
yarn test-e2e
```

Puppeteer runs headless by default. However, sometimes it's useful to observe the browser while running tests. To do so you can use these environment variables:

```bash
PUPPETEER_HEADLESS=false PUPPETEER_SLOWMO=50 npm run test-e2e
```

SlowMo slows down Puppeteer’s operations so we can see what’s going on in the browser. `PUPPETEER_SLOWMO=50` means test actions will be slowed down by 50 milliseconds.

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
