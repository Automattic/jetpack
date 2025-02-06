const config = {
	presets: [
		[
			'@automattic/jetpack-webpack-config/babel/preset',
			{ pluginReplaceTextdomain: { textdomain: 'automattic-for-agencies-client' } },
		],
	],
};

module.exports = config;
