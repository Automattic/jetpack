/**
 * For a detailed explanation of configuration properties, visit:
 * https://playwright.dev/docs/api/class-browsertype?_highlight=launch#browsertypelaunchoptions
 */

const { CI, E2E_DEBUG, HEADLESS, SLOWMO } = process.env;
let executablePath = '';
let dumpio = false;

if ( ! CI ) {
	executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
}

if ( E2E_DEBUG ) {
	dumpio = true;
	process.env.DEBUG = 'pw:api';
}

module.exports = {
	launchOptions: {
		headless: HEADLESS !== 'false',
		devtools: HEADLESS === 'false',
		slowMo: parseInt( SLOWMO, 10 ) || 0,
		executablePath,
		dumpio,
	},
	contextOptions: {
		viewport: {
			width: 1280,
			height: 1024,
		},
	},
};
