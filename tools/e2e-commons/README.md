# Jetpack e2e commons

This project is intended to be used as a dependency by other e2e tests projects for Jetpack plugins.
There are no tests defined here.

The scope of this library is to:

- provide a consistent way to launch and configure a Jetpack environment for e2e testing
- create test results, send Slack notifications
- provide the most common pages modeled as page objects (see [Page objects model](https://playwright.dev/docs/test-pom)).
- provide implementation of the most common flows (login, connect Jetpack)

## Prerequisites

You'll need `node` and `pnpm` installed, and if you're planning to run the tests against a local dev environment, `docker` is also required.

## Under the hood

The following test specific tools are used:

- [Playwright](https://playwright.dev) for browser automation
- [Playwright test](https://playwright.dev) for test management and test runner
- [Allure](https://docs.qameta.io/allure/) as test reporter

## Setup E2E tests for your Jetpack plugin

This is a step-by-step guide to get you up and running with E2E tests for a Jetpack plugin. This guide is based on E2E tests in Starter Plugin. At the end, you'll get a working E2E setup for your particular plugin that includes all the goodies available for other plugins such as:

- Conditional CI pipeline, which will run the tests only if project files (and it's dependencies) are changed.
- Slack notification system.
- Test results reporting and metrics collection.
- Local development environment for E2E tests.

To make it all work seamlessly, some assumptions are made. It means that there are chances that something might not work if this guide is not followed.

## Copy Starter Plugin E2E setup

Copy `project/plugins/starter-plugin/tests/e2e` folder into your plugin's `tests/e2e`. If your plugin was created with Starter Plugin template, the `tests/e2e` folder should be already there.

Update `tests/e2e/package.json` to match your plugin description. Also, review `build` script command, and make sure that all required projects are included in a build step.

## Update PNPM workspace definitions

For monorepo to pick up additional dependencies in `e2e` folder, it should be added into `pnpm-workspace.yaml` definitions. Add `'projects/plugins/YOUR-PLUGIN/tests/e2e'` into the file.

## Add your plugin tests into CI pipeline

In `.github/files/create-e2e-projects-matrix.sh` we define list of E2E projects to run tests for. Add your plugin into `PROJECTS` list as follows: `'{"project":"PLUGIN NAME","path":"projects/plugins/YOUR-PLUGIN/tests/e2e","testArgs":[],"slackArgs":[]}`. Be aware of spaces between entries.

### Run the tests

Now you can run the test in two different ways: against a local site, in a Docker environment; or against a remote site, that you preconfigured.

### 1. Use the local Docker environment

#### 1.1. Build your plugin

Build your plugin as well as all it's dependencies. Also, make sure to build `plugins/jetpack` since some of the functionality of the tests depends on Jetpack being active.

#### 1.3. Start the local environment

Sensitive information like credentials and other secrets is stored in an encrypted config file. This file needs to be decrypted before starting the environment.
If you're an a11n you can find the key in the secret store and set it in the `CONFIG_KEY` env var, as shown below.

To bypass the offline mode you will need your site to have a publicly accessible url that will proxy all requests to your locally running WordPress installation.
We use `localtunnel` library to expose `localhost:8889` via a public url.

```shell
## Decrypt default config file
CONFIG_KEY=secret_key pnpm config:decrypt

## Start and the Docker environment and configure the WordPress installation
pnpm env:up

## Create a tunnel
pnpm tunnel:up
```

The tunnel url will be stored in a file in the config folder of your tests, so that it can be read by the tests and then reused by the tunnel script. See config files for details.

#### 1.4. Run the tests


```shell
pnpm test:run
```

### 2. Use a remote preconfigured site

#### 2.1. Add the test site details in the config file

Edit the decrypted config file to add an entry in the `testSites` object with the details of your test site

```js
mySite: {
    url: 'site-url',
    username: 'username',
    password: 'password',
    dotComAccount: ['username', 'password']
}
```

#### 2.2. Run the tests

Set the `TEST_SITE` environment variable with the name of the previously defined configuration object.

```shell
TEST_SITE=mySite pnpm test:run
```

## Functionality plugins

Tests rely on functionality plugins that provide some additional functionality, provide shortcuts, etc.

#### e2e-plan-data-interceptor.php

The purpose of this plugin is to provide a way to `mock` a Jetpack plan, for cases when we test functionality that does not directly use paid services. A great example of this purpose is testing paid Gutenberg blocks.

#### e2e-waf-data-interceptor.php

Very similiar to the one above, but it mocks waf rules data instead of Jetpack plans.

## Test architecture

### Pages

The tests are using the `PageObject` pattern, which is a way to separate test logic from implementation. Page objects are basically abstractions around specific pages and page components.
There are two base classes that should be extended by page objects: [`WpPage`](./pages/wp-page.js) and [`PageActions`](./pages/page-actions.js) class.

`WpPage` implements common page methods, like `init` - static method that initializes a page object and checks the displayed page is the expected one, and `visit` - method that navigates to a page URL and then performs all the `init` checks.

`WpPage` extends `PageActions`.
`WpPage` should be extended by all page objects that represent full pages. Rule of thumb: if it has a URL it should extend WpPage. Otherwise, it's probably representing a page component (like a block) and should directly extend `PageActions`.

Since most of the Playwright functionality is `async` - and JavaScript constructors are not - we should initialize pages with the `init()` static method: `await BlockEditorPage.init( page )` to make sure we would wait for `expectedSelectors` checks.
Make sure you pass these selectors in a page constructor to the `super` constructor by using the `expectedSelectors` argument. This expects an array of strings, so you can pass multiple selectors in case you want to check more elements on the page.

```js
constructor( page ) {
    super( page, { expectedSelectors: [ '.selector_1', '#selector_2' ] } );
}
```

## Test reports

A few [reporters](https://playwright.dev/docs/test-reporters) are configured by default, check `config/playwright.config.default.cjs` for details.

### Allure reporter

To use allure reporter, you'll need to install a dependency.

```shell
npm i -D allure-playwright
```

Allure results are generated in the allure-results folder. You can use these results to generate a full report, but the Allure cli tool is needed for that.

1. [Install Allure cli](https://docs.qameta.io/allure/#_installing_a_commandline)
2. Generate and open the report using Allure's builtin webserver

```shell
# Run this in the path where `allure-results` folder is
allure serve
```
