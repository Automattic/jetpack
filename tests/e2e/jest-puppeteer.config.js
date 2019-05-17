/**
 * For a detailed explanation of configuration properties, visit:
 * https://github.com/GoogleChrome/puppeteer/blob/master/docs/api.md#puppeteerlaunchoptions
 */

module.exports = {
	launch: {
		headless: process.env.PUPPETEER_HEADLESS !== 'false',
		devtools: process.env.PUPPETEER_HEADLESS === 'false',
		slowMo: parseInt( process.env.PUPPETEER_SLOWMO, 10 ) || 0,
	},
};
