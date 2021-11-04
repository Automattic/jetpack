
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
- [Jest](https://jestjs.io) for test management and test runner
- [Allure](https://docs.qameta.io/allure/) as test reporter

## Getting started

This is a step-by-step guide to have a simple running test using this library. A node project is expected to exist already in the Jetpack monorepo.

### Add dependencies

Add this project as a dev dependency in your e2e tests project:

```shell
pnpm add -D path/to/tools/e2e-commons
```

Optionally, you can also add a `preinstall` script to install this project.

```shell
"preinstall": "pnpm --prefix path/to/tools/e2e-commons install"
```

Add Jest and Babel dependencies

```shell
pnpm add -D jest @babel/core @babel/preset-env babel-jest
```

Add a `jest.config.js`

```js
module.exports = {
    testEnvironment: require.resolve( 'jetpack-e2e-commons/env/playwright-environment.js' ),
    globalSetup: require.resolve( 'jetpack-e2e-commons/env/global-setup.js' ),
    globalTeardown: require.resolve( 'jetpack-e2e-commons/env/global-teardown.js' ),
    setupFilesAfterEnv: [ require.resolve( 'jetpack-e2e-commons/jest.setup.js' ), ],
};
```

Add a `babel.config.js`

```js
module.exports = {
    presets: [
        [
            '@babel/preset-env',
            {
                targets: {
                    node: 'current',
                },
            },
        ],
    ],
};
```

### Create a simple test

Create a test file `specs/quick-start.test.js`, with recommended content:

```js
import { Sidebar, DashboardPage } from 'jetpack-e2e-commons/pages/wp-admin';
import { prerequisitesBuilder } from 'jetpack-e2e-commons/env';

describe( 'Quick start test suite', () => {
    beforeEach( async () => {
        await prerequisitesBuilder()
            .withLoggedIn( true )
            .build();
    } );

    it( 'Visit Jetpack page', async () => {
        await DashboardPage.visit( page )
        await ( await Sidebar.init( page ) ).selectJetpack();
    } );
} );
``` 

### Create the test configuration files

Several configuration files are required, even though to begin with they will only export the default ones from this project. 

Create the `config/default.js` and `config/playwright.config.js` files.

```shell
mkdir config
echo "module.exports = require( 'jetpack-e2e-commons/config/default' );" > config/default.js

echo "module.exports = require( 'jetpack-e2e-commons/config/playwright.config.default' );" > config/playwright.config.js
```

### Run the tests

Now you can run the test in two different ways: against a local site, in a Docker environment; or against a remote site, that you preconfigured.

### 1. Use the local Docker environment

#### 1.1. Build Jetpack

```shell
pnpm jetpack build plugins/jetpack
```

#### 1.2. Build your plugin

Assuming you're building tests for a standalone plugin, don't forget to also build that.

#### 1.3. Start the local environment

Sensitive information like credentials and other secrets is stored in an encrypted config file. This file needs to be decrypted before starting the environment.
If you're an a11n you can find the key in the secret store and set it in the `CONFIG_KEY` env var, as shown below. 

To bypass the offline mode you will need your site to have a publicly accessible url that will proxy all requests to your locally running WordPress installation.
We use `localtunnel` library to expose `localhost:8889` via a public url.

```shell
## Decrypt default config file
CONFIG_KEY=secret_key openssl enc -md sha1 -aes-256-cbc -d -pass env:CONFIG_KEY -in ./node_modules/jetpack-e2e-commons/config/encrypted.enc -out config/local-test.js

## Start and the Docker environment and configure the WordPress installation
pnpm e2e-env start

## Create a tunnel
pnpm tunnel on 
```

The tunnel url will be stored in a file in the config folder of your tests, so that it can be read by the tests and then reused by the tunnel script. See config files for details.

#### 1.4. Run the tests

```shell
NODE_CONFIG_DIR='./config' pnpm jest
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
TEST_SITE=mySite NODE_CONFIG_DIR='./config' pnpm jest
```

## Functionality plugins

Tests rely on functionality plugins that provide some additional functionality, provide shortcuts, etc.

#### e2e-plan-data-interceptor.php

The purpose of this plugin is to provide a way to `mock` a Jetpack plan, for cases when we test functionality that does not directly use paid services. A great example of this purpose is testing paid Gutenberg blocks.

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

Allure results are generated in the allure-results folder. You can use these results to generate a full report, but the Allure cli tool is needed for that.

1. [Install Allure cli](https://docs.qameta.io/allure/#_installing_a_commandline)
2. Generate and open the report using Allure's builtin webserver

```shell
# Run this in the path where `allure-results` folder is
allure serve
```

### Update the result path

All test output (logs, screenshots, video files) is configured to be written in `output` folder, so it's recommended to have the allure results in the same place, especially if in CI you're using the [Jetpack e2e reports tools](https://github.com/Automattic/jetpack-e2e-reports/), which expects the allure results to be inside `output/allure-results` when generating the report.

Update your jest.config.js file to configure the result path: 

```js
module.exports = {    
    [...]
    testEnvironmentOptions: {
        resultsDir: 'output/allure-results',
    }
};
```
