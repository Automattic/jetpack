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
						exclude: [
							// Exclude transforms that make all code slower, see https://github.com/facebook/create-react-app/pull/5278
							'transform-typeof-symbol',
							// We don't need these, and they bloat the bundles.
							/^esnext\.iterator\./,
						],
						useBuiltIns: 'usage',
					},
					pluginReplaceTextdomain: { textdomain: 'jetpack-search-pkg' },
				},
			],
		],
	};
};
