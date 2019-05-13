/**
 * For a detailed explanation of configuration properties, visit:
 * https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions
 */

module.exports = {
	launch: {
		headless: false,
		exitOnPageError: false,
		devtools: true,
		slowMo: 10,
		executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
		// headless: process.env.PUPPETEER_HEADLESS !== 'false',
		// slowMo: parseInt( process.env.PUPPETEER_SLOWMO, 10 ) || 0,
	},
};
