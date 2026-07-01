const config = {
	targets: require( '@automattic/jetpack-webpack-config/targets' ),
	presets: [
		[
			'@automattic/jetpack-webpack-config/babel/preset',
			{ pluginReplaceTextdomain: { textdomain: 'jetpack-explat' } },
		],
	],
};

module.exports = config;
