module.exports = api => {
	api.cache( true );
	return {
		presets: [
			[
				'@automattic/jetpack-webpack-config/babel/preset',
				{
					presetEnv: {
						corejs: require( 'core-js/package.json' ).version,
						modules: false,
						useBuiltIns: 'usage',
					},
					pluginReplaceTextdomain: { textdomain: 'jetpack-action-bar' },
				},
			],
		],
		plugins: [
			[
				'@babel/plugin-transform-react-jsx',
				{
					runtime: 'automatic',
					importSource: 'preact',
				},
			],
		],
	};
};
