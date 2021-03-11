/**
 * For a detailed explanation of configuration properties, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

if ( process.env.E2E_DEBUG ) {
	process.env.DEBUG = 'pw:browser|api|error';
}

module.exports = {
	testEnvironment: '<rootDir>/lib/env/playwright-environment.js',
	globalSetup: '<rootDir>/lib/env/global-setup.js',
	globalTeardown: '<rootDir>/lib/env/global-teardown.js',
	setupFilesAfterEnv: [ '<rootDir>/lib/env/test-setup.js', '<rootDir>/jest.setup.js' ],
	testRunner: 'jest-circus/runner',
	reporters: [
		'default',
		[
			'jest-junit',
			{
				suiteName: 'Jetpack E2E tests',
				outputDirectory: 'output/reports',
				outputName: 'junit-results.xml',
				uniqueOutputName: 'true',
			},
		],
		[
			'jest-stare',
			{
				resultDir: `output/reports/jest-stare`,
				reportTitle: 'Jetpack E2E tests',
			},
		],
	],
};
