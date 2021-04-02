const { chromium } = require( 'playwright' );
const mkdirp = require( 'mkdirp' );
const path = require( 'path' );
const fs = require( 'fs' );
const os = require( 'os' );
const config = require( 'config' );
const pwBrowserOptions = require( '../../playwright.config' ).pwBrowserOptions;
import logger from '../logger';

const TMP_DIR = path.join( os.tmpdir(), 'jest_playwright_global_setup' );

module.exports = async function () {
	// Create the temp config dir used to store all kinds of temp config stuff
	// This is needed because writeFileSync doesn't create parent dirs and will fail
	fs.mkdirSync( config.get( 'dirs.temp' ), { recursive: true } );

	// Create the file used to save browser storage to skip login actions
	// If the file is missing Playwright context creation will fail
	// If the file already exists the content gets overwritten with an empty object
	fs.writeFileSync( config.get( 'temp.storage' ), '{}' );

	// Launch a browser server that client can connect to
	logger.debug( 'Launching PW server' );
	global.browser = await chromium.launchServer( pwBrowserOptions );
	mkdirp.sync( TMP_DIR );
	fs.writeFileSync( path.join( TMP_DIR, 'wsEndpoint' ), global.browser.wsEndpoint() );
};
