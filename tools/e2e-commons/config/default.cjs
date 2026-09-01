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
		pid: `${ tempDir }/tunnel.pid`,
		jetpackPrivateOptions: `${ tempDir }/jetpack-private-options.json`,
		planData: `${ tempDir }/plan-data.json`,
	},
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
