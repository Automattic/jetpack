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
	testOutputDir: './output',
	configDir: './config',
	consoleIgnore: [
		'Button isDefault prop is deprecated',
		'Using custom components as toolbar controls is deprecated',
		'wp.components.IconButton is deprecated',
		'Using Toolbar without label prop is deprecated',
		'elements with non-unique id #_wpnonce',
		'net::ERR_UNKNOWN_URL_SCHEME',
		'A cookie associated with a cross-site resource',
		'This is a global warning',
	],
};

module.exports = config;
