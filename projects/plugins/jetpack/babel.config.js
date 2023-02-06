const config = {
	presets: [
		[
			'@automattic/jetpack-webpack-config/babel/preset',
			{ pluginReplaceTextdomain: { textdomain: 'jetpack' } },
		],
	],
	plugins: [ '@babel/plugin-proposal-nullish-coalescing-operator' ],
	overrides: [
		{
			test: './extensions/',
			presets: [],
			plugins: [
				[
					require.resolve( '@wordpress/babel-plugin-import-jsx-pragma' ),
					{
						scopeVariable: 'createElement',
						scopeVariableFrag: 'Fragment',
						source: require.resolve( '@wordpress/element' ),
						isDefault: false,
					},
				],
				[
					require.resolve( '@babel/plugin-transform-react-jsx' ),
					{
						pragma: 'createElement',
						pragmaFrag: 'Fragment',
					},
				],
			],
		},
	],
	env: {
		test: {
			presets: [ [ require.resolve( '@babel/preset-env' ), { targets: { node: 'current' } } ] ],
			plugins: [
				[ require.resolve( '@babel/plugin-transform-runtime' ), { absoluteRuntime: __dirname } ],
			],
		},
	},
};

module.exports = config;
