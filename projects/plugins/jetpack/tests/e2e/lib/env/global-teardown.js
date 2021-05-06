const os = require( 'os' );
const rimraf = require( 'rimraf' );
const path = require( 'path' );

const DIR = path.join( os.tmpdir(), 'jest_playwright_global_setup' );

module.exports = async function () {
	// Close browser
	await global.browser.close();
	rimraf.sync( DIR );
};
