/**
 * For a detailed explanation of configuration properties, visit:
 * https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions
 */

let executablePath = '';
let dumpio = false;
if ( ! process.env.CI ) {
	executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
}

if ( process.env.E2E_DEBUG ) {
	dumpio = true;
}

module.exports = {
	launch: {
		headless: process.env.PUPPETEER_HEADLESS !== 'false',
		devtools: process.env.PUPPETEER_HEADLESS === 'false',
		slowMo: parseInt( process.env.PUPPETEER_SLOWMO, 10 ) || 0,
		executablePath,
		dumpio,
	},
	/**
	 * Switched to false to make tests work with WP.com due to Chromium error:
	 * [0813/201724.630944:INFO:CONSOLE(1)] "Uncaught SyntaxError: Unexpected identifier", source: https://sp.analytics.yahoo.com/sp.pl?a=10000&jsonp=YAHOO.ywa.I13N.handleJSONResponse&b=WordPress.com%3A%20Create%20a%20Free%20Website%20or%20Blog&.yp=10014088&f=https%3A%2F%2Fwordpress.com%2F&enc=UTF-8 (1)
	 * TODO: maybe switch back to true in a while
	 */
	exitOnPageError: false,
};
