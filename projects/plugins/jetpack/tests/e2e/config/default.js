const config = {
	WP_ADMIN_USER: {
		username: 'admin',
		password: 'password',
	},
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
	configDir: './config',
	testOutputDir: './output',
	screenshotsDir: './output/screenshots',
	videosDir: './output/videos',
	logsDir: './output/logs',
	reportsDir: './output/reports',
	consoleIgnore: [
		'This is a global warning',
		'A cookie associated with a cross-site resource',
		'net::ERR_UNKNOWN_URL_SCHEME',
		'elements with non-unique id #_wpnonce',
		'is deprecated',
		'SharedArrayBuffer will require cross-origin isolation as of M91, around May 2021',
	],
};

module.exports = config;
