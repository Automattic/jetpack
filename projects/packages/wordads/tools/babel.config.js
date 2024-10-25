module.exports = api => {
	api.cache( true );
	return {
		presets: [
			[
				'@automattic/jetpack-webpack-config/babel/preset',
				{
					autoWpPolyfill: false,
					presetEnv: {
						corejs: require( 'core-js/package.json' ).version,
						modules: false,
						useBuiltIns: 'usage',
					},
					pluginReplaceTextdomain: { textdomain: 'jetpack-wordads' },
				},
			],
		],
	};
};
