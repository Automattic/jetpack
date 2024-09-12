const config = {
	presets: [
		[
			'@automattic/jetpack-webpack-config/babel/preset',
			{ pluginReplaceTextdomain: { textdomain: 'classic-theme-helper-plugin' } },
		],
	],
};

module.exports = config;
