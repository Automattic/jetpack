const outputDir = './output';
const configDir = './config';
const tempDir = `${ configDir }/tmp`;
const config = {
	WP_BASE_URL: 'http://localhost',
	testCardCredentials: {
		cardHolder: 'End To End Testing',
		cardType: 'VISA',
		cardNumber: '4242 4242 4242 4242', // https://stripe.com/docs/testing#cards
		cardExpiry: '02/49',
		cardCVV: '300',
		cardCountryCode: 'TR', // using Turkey to force Stripe as payment processor
		cardPostCode: '4000',
	},
	dirs: {
		config: configDir,
		output: outputDir,
		temp: tempDir,
		screenshots: `./${ outputDir }/screenshots`,
		videos: `./${ outputDir }/videos`,
		logs: `./${ outputDir }/logs`,
		reports: `./${ outputDir }/reports`,
	},
	temp: {
		storage: `${ tempDir }/storage.json`,
		tunnels: `${ tempDir }/e2e-tunnels.txt`,
		jetpackPrivateOptions: `${ tempDir }/jetpack-private-options.json`,
		planData: `${ tempDir }/plan-data.json`,
		sidebarsWidgetsFile: `${ tempDir }/sidebars-widgets.json`,
		searchWidgetFile: `${ tempDir }/search-widget.json`,
		blockWidgetsFile: `${ tempDir }/widget-block.json`,
	},
	consoleIgnore: [
		'This is a global warning',
		'A cookie associated with a cross-site resource',
		'net::ERR_UNKNOWN_URL_SCHEME',
		'elements with non-unique id #_wpnonce',
		'is deprecated',
		'SharedArrayBuffer will require cross-origin isolation as of M91, around May 2021',
	],
	repository: {
		url: 'https://github.com/Automattic/jetpack',
		mainBranch: 'master',
	},
	blocks: {
		pinterest: {
			pinId: '689332286716774968',
		},
	},
};

module.exports = config;
