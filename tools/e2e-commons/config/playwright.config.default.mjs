import fs from 'fs';
import { fileURLToPath } from 'url';
import { defineConfig, devices } from '@playwright/test';
import config from 'config';
import { resolveSiteUrl, setWpEnvVars } from '../helpers/utils-helper.js';

const reporter = [
	[ 'list' ],
	[ 'json', { outputFile: `${ config.get( 'dirs.output' ) }/summary.json` } ],
	[ 'allure-playwright' ],
	[
		`${ fileURLToPath(
			new URL( '../' + config.get( 'dirs.reporters' ), import.meta.url )
		) }/reporter.js`,
	],
];

if ( process.env.CI ) {
	reporter.push(
		[ 'github' ],
		[
			`${ fileURLToPath(
				new URL( '../' + config.get( 'dirs.reporters' ), import.meta.url )
			) }/flaky-tests-reporter.ts`,
		]
	);
}

// Fail early if the required test site config is not defined
// Let config lib throw by using get function on an undefined property
if ( process.env.TEST_SITE ) {
	config.get( 'testSites' ).get( process.env.TEST_SITE );
}

// Create the temp config dir used to store all kinds of temp config stuff
// This is needed because writeFileSync doesn't create parent dirs and will fail
fs.mkdirSync( config.get( 'dirs.temp' ), { recursive: true } );

// Create the file used to save browser storage to skip login actions if it doesn't already exist
// If the file is missing Playwright context creation will fail
if ( ! fs.existsSync( config.get( 'temp.storage' ) ) ) {
	fs.writeFileSync( config.get( 'temp.storage' ), '{}' );
}
// Ensure the environment variables for `@wordpress/e2e-test-utils-playwright` are set
setWpEnvVars();

const playwrightConfig = defineConfig( {
	timeout: 300000,
	retries: process.env.CI ? 2 : 0,
	workers: 1,
	outputDir: config.get( 'dirs.results' ),
	reporter,
	forbidOnly: !! process.env.CI,
	globalSetup: fileURLToPath( new URL( './global-setup.mjs', import.meta.url ).href ),
	use: {
		baseURL: resolveSiteUrl(),
		headless: true,
		viewport: { width: 1280, height: 1600 },
		ignoreHTTPSErrors: true,
		actionTimeout: 20000,
		screenshot: {
			mode: 'only-on-failure',
			fullPage: true,
		},
		video: 'retain-on-failure',
		trace: process.env.CI ? 'off' : 'retain-on-failure',
		storageState: config.get( 'temp.storage' ),
		userAgent:
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36 wp-e2e-tests',
		locale: 'en-US',
		contextOptions: {
			reducedMotion: 'reduce',
			// TODO - Enable strictSelectors once all tests are updated.
			// strictSelectors: true,
		},
	},
	reportSlowTests: null,
	projects: [
		{
			name: 'chromium',
			use: { ...devices[ 'Desktop Chrome' ] },
		},
	],
} );

export default playwrightConfig;
