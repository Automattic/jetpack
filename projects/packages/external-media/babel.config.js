const config = {
	targets: require( '@automattic/jetpack-webpack-config/targets' ),
	presets: [
		[
			'@automattic/jetpack-webpack-config/babel/preset',
			{ pluginReplaceTextdomain: { textdomain: 'jetpack-external-media' } },
		],
	],
};

module.exports = config;
