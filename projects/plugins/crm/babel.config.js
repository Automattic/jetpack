const config = {
	presets: [
		[
			'@automattic/jetpack-webpack-config/babel/preset',
			{ pluginReplaceTextdomain: { textdomain: 'zero-bs-crm' } },
		],
	],
};

module.exports = config;
