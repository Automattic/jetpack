const config = {
	presets: [
		[
			'@automattic/jetpack-webpack-config/babel/preset',
			{ pluginReplaceTextdomain: { textdomain: 'paypal-payment-buttons' } },
		],
	],
};

module.exports = config;
