/**
 * For a detailed explanation of configuration properties, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

if ( process.env.E2E_DEBUG ) {
	process.env.DEBUG = 'pw:browser|api|error';
	process.env.PWDEBUG = 1;
}

module.exports = {
	testEnvironment: require.resolve( 'jetpack-e2e-commons/env/playwright-environment.js' ),
	globalSetup: require.resolve( 'jetpack-e2e-commons/env/global-setup.js' ),
	globalTeardown: require.resolve( 'jetpack-e2e-commons/env/global-teardown.js' ),
	setupFilesAfterEnv: [ require.resolve( 'jetpack-e2e-commons/jest.setup.js' ) ],
	testRunner: 'jest-circus/runner',
	runner: 'groups',
	testEnvironmentOptions: {
		resultsDir: 'output/allure-results',
	},
	reporters: [],
};
