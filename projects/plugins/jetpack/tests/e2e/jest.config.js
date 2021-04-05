/**
 * For a detailed explanation of configuration properties, visit:
 * https://jestjs.io/docs/en/configuration.html
 */

const fs = require( 'fs' );
const config = require( 'config' );
const URL = require( 'url' ).URL;

if ( process.env.E2E_DEBUG ) {
	process.env.DEBUG = 'pw:browser|api|error';
	process.env.PWDEBUG = 1;
}

/**
 * There are two ways to set the target site url:
 * 1. Write it in 'temp.tunnels' file
 * 2. Set SITE_URL env variable. This overrides any value written in file
 * If none of the above is valid we throw an error
 */
if ( ! process.env.SITE_URL ) {
	const urlFromFile = fs
		.readFileSync( config.get( 'temp.tunnels' ), 'utf8' )
		.replace( 'http:', 'https:' );

	if ( ! new URL( urlFromFile ) ) {
		throw new Error( 'Undefined or invalid SITE_URL!' );
	} else {
		process.env.SITE_URL = urlFromFile;
	}
}

module.exports = {
	testEnvironment: '<rootDir>/lib/env/playwright-environment.js',
	globalSetup: '<rootDir>/lib/env/global-setup.js',
	globalTeardown: '<rootDir>/lib/env/global-teardown.js',
	setupFilesAfterEnv: [ '<rootDir>/lib/env/test-setup.js', '<rootDir>/jest.setup.js' ],
	testRunner: 'jest-circus/runner',
	globals: {
		siteUrl: process.env.SITE_URL,
	},
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
