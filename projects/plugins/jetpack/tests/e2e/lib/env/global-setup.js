const { chromium } = require( 'playwright' );
const mkdirp = require( 'mkdirp' );
const path = require( 'path' );
const fs = require( 'fs' );
const os = require( 'os' );
const config = require( 'config' );
const { join } = require( 'path' );
const WordpressAPI = require( '../api/wp-api' );
const { getSiteCredentials, resolveSiteUrl } = require( '../utils-helper' );
const logger = require( '../logger' );
const pwBrowserOptions = require( '../../playwright.config' ).pwBrowserOptions;

const TMP_DIR = path.join( os.tmpdir(), 'jest_playwright_global_setup' );

async function logEnvironment() {
	try {
		const envFilePath = join( `${ config.get( 'dirs.output' ) }`, 'environment.json' );

		let env = { plugins: [] };

		if ( fs.existsSync( envFilePath ) ) {
			env = fs.readFileSync( envFilePath );
		}

		const wpApi = new WordpressAPI( getSiteCredentials(), resolveSiteUrl() );
		const plugins = await wpApi.getPlugins();

		for ( const p of plugins ) {
			env.plugins.push( {
				plugin: p.plugin,
				version: p.version,
				status: p.status,
			} );
		}

		fs.writeFileSync( envFilePath, JSON.stringify( env ) );
	} catch ( error ) {
		logger.error( `Logging environment details failed! ${ error }` );
	}
}

module.exports = async function () {
	// Fail early if the required test site config is not defined
	// Let config lib throw by using get function on an undefined property
	if ( process.env.TEST_SITE ) {
		config.get( 'testSites' ).get( process.env.TEST_SITE );
	}

	// Create the temp config dir used to store all kinds of temp config stuff
	// This is needed because writeFileSync doesn't create parent dirs and will fail
	fs.mkdirSync( config.get( 'dirs.temp' ), { recursive: true } );

	// Create the file used to save browser storage to skip login actions
	// If the file is missing Playwright context creation will fail
	// If the file already exists the content gets overwritten with an empty object
	fs.writeFileSync( config.get( 'temp.storage' ), '{}' );

	// Launch a browser server that client can connect to
	global.browser = await chromium.launchServer( pwBrowserOptions );
	mkdirp.sync( TMP_DIR );
	fs.writeFileSync( path.join( TMP_DIR, 'wsEndpoint' ), global.browser.wsEndpoint() );

	await logEnvironment();
};
