/**
 * For a detailed explanation of configuration properties, visit:
 * https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions
 */
const fs = require( 'fs' );
const { CI, E2E_DEBUG, PUPPETEER_HEADLESS, PUPPETEER_SLOWMO } = process.env;
let executablePath = '';
let dumpio = false;
const isMacOS = process.platform === 'darwin';
const isLinux = process.platform === 'linux';

// Workaround for detached iFrames, which is needed for in-place connection. https://stackoverflow.com/a/59999976/3078381
const launchArgs = [
	'--disable-features=IsolateOrigins,site-per-process,SameSiteByDefaultCookies',
];
if ( ! CI ) {
	if ( isMacOS ) {
		try {
			fs.accessSync( `/Applications/Google Chrome.app` );
			executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
		} catch ( err ) {
			console.log( 'Chrome is not installed. Using bundled Chromium' );
		}
	} else if ( isLinux ) {
		launchArgs.push( '--no-sandbox' );
	}
}

if ( E2E_DEBUG ) {
	dumpio = true;
}

module.exports = {
	launch: {
		headless: PUPPETEER_HEADLESS !== 'false',
		devtools: PUPPETEER_HEADLESS === 'false',
		slowMo: parseInt( PUPPETEER_SLOWMO, 10 ) || 0,
		executablePath,
		dumpio,
		args: launchArgs,
	},
	/**
	 * Switched to false to make tests work with WP.com due to Chromium error:
	 * [0813/201724.630944:INFO:CONSOLE(1)] "Uncaught SyntaxError: Unexpected identifier", source: https://sp.analytics.yahoo.com/sp.pl?a=10000&jsonp=YAHOO.ywa.I13N.handleJSONResponse&b=WordPress.com%3A%20Create%20a%20Free%20Website%20or%20Blog&.yp=10014088&f=https%3A%2F%2Fwordpress.com%2F&enc=UTF-8 (1)
	 * TODO: maybe switch back to true in a while
	 */
	exitOnPageError: false,
};
