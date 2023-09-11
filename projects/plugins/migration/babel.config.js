const config = {
	presets: [
		[
			'@automattic/jetpack-webpack-config/babel/preset',
			{ pluginReplaceTextdomain: { textdomain: 'wpcom-migration' } },
		],
	],
};

module.exports = config;
