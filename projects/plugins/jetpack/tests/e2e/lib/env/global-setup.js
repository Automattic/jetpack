const { chromium } = require( 'playwright' );
const mkdirp = require( 'mkdirp' );
const path = require( 'path' );
const fs = require( 'fs' );
const os = require( 'os' );
import TunnelManager from './tunnel-manager';

const DIR = path.join( os.tmpdir(), 'jest_playwright_global_setup' );
let { E2E_DEBUG, HEADLESS, SLOWMO } = process.env;

module.exports = async function () {
	// Create tunnel. Make it global so we can access it in global-teardown
	global.tunnelManager = new TunnelManager();
	await global.tunnelManager.create( process.env.SKIP_CONNECT );

	// Create the file used to save browser storage to skip login actions
	// If the file is missing Playwright context creation will fail
	// If the file already exists the content gets overwritten with an empty object
	fs.writeFileSync( 'config/storage.json', '{}' );

	if ( E2E_DEBUG ) {
		process.env.DEBUG = 'pw:browser|api|error';
		HEADLESS = 'false';
	}

	// Launch a browser server that client can connect to
	global.browser = await chromium.launchServer( {
		headless: HEADLESS !== 'false',
		slowMo: parseInt( SLOWMO, 10 ) || 0,
		devtools: HEADLESS === 'false',
	} );
	mkdirp.sync( DIR );
	fs.writeFileSync( path.join( DIR, 'wsEndpoint' ), global.browser.wsEndpoint() );
};
