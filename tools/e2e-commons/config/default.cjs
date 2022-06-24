const outputDir = './output';
const configDir = './config';
const tempDir = `${ configDir }/tmp`;
const resultsDir = `${ outputDir }/results`;

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
		results: resultsDir,
		reporters: `./reporters`,
		logs: `./${ outputDir }/logs`,
		screenshots: `./${ resultsDir }/screenshots`,
		videos: `./${ resultsDir }/videos`,
		reports: `./${ resultsDir }/reports`,
	},
	temp: {
		storage: `${ tempDir }/storage.json`,
		tunnels: `${ tempDir }/e2e-tunnels.txt`,
		jetpackPrivateOptions: `${ tempDir }/jetpack-private-options.json`,
		planData: `${ tempDir }/plan-data.json`,
	},
	consoleIgnore: [
		'This is a global warning',
		'A cookie associated with a cross-site resource',
		'net::ERR_UNKNOWN_URL_SCHEME',
		'elements with non-unique id #_wpnonce',
		'is deprecated',
		'SharedArrayBuffer will require cross-origin isolation as of M91, around May 2021',
		'Warning: getDefaultProps is only used on classic React.createClass definitions',
		'Warning: A future version of React will block javascript: URLs as a security precaution',
	],
	repository: {
		url: 'https://github.com/Automattic/jetpack',
		mainBranch: 'trunk',
	},
	blocks: {
		pinterest: {
			pinId: '689332286716774968',
		},
	},
};

module.exports = config;
