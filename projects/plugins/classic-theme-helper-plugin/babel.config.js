const config = {
	presets: [
		[
			'@automattic/jetpack-webpack-config/babel/preset',
			{ pluginReplaceTextdomain: { textdomain: 'jetpack-classic-theme-helper-plugin' } },
		],
	],
};

module.exports = config;
