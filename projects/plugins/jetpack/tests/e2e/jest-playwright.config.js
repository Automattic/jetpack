/**
 * For a detailed explanation of configuration properties, visit:
 * https://playwright.dev/#version=v1.5.2&path=docs%2Fapi.md&q=browsertypelaunchoptions--options
 */

const { CI, E2E_DEBUG, HEADLESS, SLOWMO } = process.env;
let executablePath = '';
let dumpio = false;

if ( ! CI ) {
	executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
}

if ( E2E_DEBUG ) {
	dumpio = true;
}

module.exports = {
	launchOptions: {
		headless: HEADLESS !== 'false',
		// devtools: HEADLESS === 'false',
		slowMo: parseInt( SLOWMO, 10 ) || 0,
		executablePath,
		dumpio,
	},
};
