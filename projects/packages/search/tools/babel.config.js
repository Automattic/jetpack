module.exports = api => {
	api.cache( true );

	const presetConfig = {
		autoWpPolyfill: false,
		presetEnv: {
			modules: false,
			exclude: [
				// Exclude transforms that make all code slower, see https://github.com/facebook/create-react-app/pull/5278
				'transform-typeof-symbol',
			],
		},
		pluginTransformRuntime: {
			// babel-plugin-polyfill-corejs3 otherwise makes it want @babel/runtime-corejs3
			moduleName: '@babel/runtime',
		},
		pluginReplaceTextdomain: { textdomain: 'jetpack-search-pkg' },
	};

	const corejsPlugin = [
		'babel-plugin-polyfill-corejs3',
		{
			method: 'usage-global',
			version: require( 'core-js/package.json' ).version,
			exclude: [
				// We don't need these, and they bloat the bundles.
				/^esnext\.iterator\./,
			],
		},
	];

	return {
		presets: [ [ '@automattic/jetpack-webpack-config/babel/preset', presetConfig ] ],
		plugins: [ corejsPlugin ],
		overrides: [
			// instant-search uses preact instead of react. That still uses the old runtime.
			{
				test: /\/instant-search\//,
				presets: [
					[
						'@automattic/jetpack-webpack-config/babel/preset',
						{
							...presetConfig,
							presetReact: {
								runtime: 'classic',
								useSpread: true,
							},
						},
					],
				],
				plugins: [ corejsPlugin ],
			},
		],
	};
};
