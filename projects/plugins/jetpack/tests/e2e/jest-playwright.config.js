/**
 * For a detailed explanation of configuration properties, visit:
 * https://playwright.dev/docs/api/class-browsertype?_highlight=launch#browsertypelaunchoptions
 */

let { E2E_DEBUG, HEADLESS, SLOWMO } = process.env;

if ( E2E_DEBUG ) {
	process.env.DEBUG = 'pw:browser|api|error';
	HEADLESS = 'false';
}

module.exports = {
	exitOnPageError: false,
	launchOptions: {
		headless: HEADLESS !== 'false',
		devtools: HEADLESS === 'false',
		slowMo: parseInt( SLOWMO, 10 ) || 0,
	},
	contextOptions: {
		viewport: {
			width: 1280,
			height: 1024,
		},
	},
};
