/**
 * For a detailed explanation of configuration properties, visit:
 * https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions
 */

let executablePath = '';
if ( ! process.env.CI ) {
	executablePath = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
}

module.exports = {
	launch: {
		headless: process.env.PUPPETEER_HEADLESS !== 'false',
		devtools: process.env.PUPPETEER_HEADLESS === 'false',
		slowMo: parseInt( process.env.PUPPETEER_SLOWMO, 10 ) || 0,
		executablePath,
	},
};
