/**
 * For a detailed explanation of configuration properties, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

const { resolveSiteUrl } = require( './lib/utils-helper' );

if ( process.env.E2E_DEBUG ) {
	process.env.DEBUG = 'pw:browser|api|error';
	process.env.PWDEBUG = 0;
}

module.exports = {
	testEnvironment: '<rootDir>/lib/env/playwright-environment.js',
	globalSetup: '<rootDir>/lib/env/global-setup.js',
	globalTeardown: '<rootDir>/lib/env/global-teardown.js',
	setupFilesAfterEnv: [ '<rootDir>/jest.setup.js', 'expect-playwright' ],
	testRunner: 'jest-circus/runner',
	modulePathIgnorePatterns: ['config'],
	runner: 'groups',
	globals: {
		siteUrl: resolveSiteUrl(),
	},
	testEnvironmentOptions: {
		resultsDir: 'output/allure-results',
	},
	reporters: [
		'default',
		[
			'jest-junit',
			{
				suiteName: 'Jetpack Boost E2E tests',
				outputDirectory: 'output/reports',
				outputName: 'junit-results.xml',
				uniqueOutputName: 'true',
			},
		],
		[
			'jest-stare',
			{
				resultDir: `output/reports/jest-stare`,
				reportTitle: 'Jetpack Boost E2E tests',
			},
		],
	],
};
