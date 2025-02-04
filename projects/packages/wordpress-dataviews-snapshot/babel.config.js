const config = {
	presets: [
		[
			'@automattic/jetpack-webpack-config/babel/preset',
			{ pluginReplaceTextdomain: { textdomain: 'jetpack-wordpress-dataviews-snapshot' } },
		],
	],
};

module.exports = config;
