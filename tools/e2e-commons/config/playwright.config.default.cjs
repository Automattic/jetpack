const config = require( 'config' );
const fs = require( 'fs' );
const path = require( 'path' );

const reporter = [
	[ 'list' ],
	[ 'json', { outputFile: `${ config.get( 'dirs.output' ) }/summary.json` } ],
	[ 'allure-playwright' ],
	[ `${ path.resolve( __dirname, '../', config.get( 'dirs.reporters' ) ) }/reporter.cjs` ],
];

if ( process.env.CI ) {
	reporter.push( [ 'github' ] );
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

const playwrightConfig = {
	timeout: 300000,
	retries: 0,
	workers: 1,
	outputDir: config.get( 'dirs.results' ),
	reporter,
	use: {
		browserName: 'chromium',
		channel: '',
		headless: true,
		viewport: { width: 1280, height: 720 },
		ignoreHTTPSErrors: true,
		actionTimeout: 30000,
		screenshot: 'only-on-failure',
		video: 'retain-on-failure',
		trace: process.env.CI ? 'off' : 'retain-on-failure',
		storageState: config.get( 'temp.storage' ),
		userAgent:
			'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/104.0.0.0 Safari/537.36 wp-e2e-tests',
	},
	reportSlowTests: null,
};

module.exports = playwrightConfig;
