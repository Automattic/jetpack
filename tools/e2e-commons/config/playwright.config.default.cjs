const config = require( 'config' );

const reporter = [
	['list'],
	['json', {  outputFile: `${ config.get('dirs.output') }/summary.json` }],
	['allure-playwright'],
	['html', { outputFolder: `${ config.get('dirs.reports') }/playwright-report` }]
]

if (process.env.CI) {
	reporter.push(['github'])
}

const playwrightConfig = {
	timeout: 300000,
	retries: 0,
	workers: 1,
	outputDir: config.get('dirs.output'),
	reporter,
	use: {
		browserName: 'chromium',
		channel: '',
		headless: true,
		viewport: { width: 1280, height: 720 },
		ignoreHTTPSErrors: true,
		actionTimeout: 20000,
		video: 'retain-on-failure',
		trace: 'retain-on-failure',
		storageState: config.get( 'temp.storage' ),
		userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 11_2_2) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/90.0.4392.0 Safari/537.36 wp-e2e-tests'
	},
};

module.exports = playwrightConfig;
