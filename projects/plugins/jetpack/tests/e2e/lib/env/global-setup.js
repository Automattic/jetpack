const { chromium } = require( 'playwright' );
const mkdirp = require( 'mkdirp' );
const path = require( 'path' );
const fs = require( 'fs' );
const os = require( 'os' );
const pwBrowserOptions = require( '../../playwright.config' ).pwBrowserOptions;
import TunnelManager from './tunnel-manager';

const TMP_DIR = path.join( os.tmpdir(), 'jest_playwright_global_setup' );

module.exports = async function () {
	// Create tunnel. Make it global so we can access it in global-teardown
	global.tunnelManager = new TunnelManager();
	await global.tunnelManager.create( process.env.SKIP_CONNECT );

	// Create the file used to save browser storage to skip login actions
	// If the file is missing Playwright context creation will fail
	// If the file already exists the content gets overwritten with an empty object
	fs.writeFileSync( 'config/storage.json', '{}' );

	// Launch a browser server that client can connect to
	global.browser = await chromium.launchServer( pwBrowserOptions );
	mkdirp.sync( TMP_DIR );
	fs.writeFileSync( path.join( TMP_DIR, 'wsEndpoint' ), global.browser.wsEndpoint() );
};
