
# Jetpack e2e commons

This project is intended to be used as a dependency by other e2e tests projects for Jetpack plugins.
There are no tests defined here.

With this project you'll be able to:
- consistently launch and configure a Jetpack environment
- create test results, send Slack notifications
- use the most common pages modeled as page objects (see [Page objects model](https://playwright.dev/docs/test-pom)).
- use the most common flows (login, connect Jetpack)

## Prerequisites

You'll need `node` and `pnpm` installed, and if you're planning to run the tests against a local dev environment, `docker` is also required.

## Under the hood

The following test specific tools are used:

- [Playwright](https://playwright.dev) for browser automation
- [Jest](https://jestjs.io) for test management and test runner
- [Allure](https://docs.qameta.io/allure/) as test reporter

## Getting started

### Add dependencies

Add this project as a dev dependency in your e2e tests project:

```shell
pnpm add -D path/to/tools/e2e-commons
```

Optional, you can also add a `preinstall` script to install this project.

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

Create a test file `specs/quick-start.test.js`

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
		await DashboardPage.visit( page );
		await ( await Sidebar.init( page ) ).selectJetpack();
	} );
} );
``` 

### Create the test configuration files

Several configuration files are required, even though to begin with they will only export the default ones from this project. 

Create the `config/default.js` and `config/playwright.config.js` files.

```shell
mkdir config
touch config/default.js
echo "module.exports = require( 'jetpack-e2e-commons/config/default' );" >> config/default.js

touch config/playwright.config.js
echo "module.exports = require( 'jetpack-e2e-commons/config/playwright.config.default' );" >> config/playwright.config.js
```

### Run the test against a local environment

#### Build the test environment

1. Build Jetpack

```shell
pnpm jetpack build plugins/jetpack
```

2. Build your plugin

Assuming you're building tests for a standalone plugin, don't forget to also build that.

3. Start the local environment

```shell
## Decrypt default config file
CONFIG_KEY=secret_key openssl enc -md sha1 -aes-256-cbc -d -pass env:CONFIG_KEY -in ./node_modules/jetpack-e2e-commons/config/encrypted.enc -out ./node_modules/jetpack-e2e-commons/config/local-test.js

## Start and the Docker environment and configure
pnpm e2e-env start

## Create a tunnel
pnpm tunnel on 
```

#### Run the tests

```shell
NODE_CONFIG_DIR='./config' pnpm jest
```

### Run the test against an external preconfigured site

```shell
TEST_SITE=mySite NODE_CONFIG_DIR='./config' pnpm jest
```
