const config = {
	presets: [
		[
			'@automattic/jetpack-webpack-config/babel/preset',
			{ pluginReplaceTextdomain: { textdomain: 'jetpack' } },
		],
	],
	overrides: [
		{
			test: './extensions/',
			presets: [],
			plugins: [
				[
					require.resolve( '@babel/plugin-transform-react-jsx' ),
					{
						runtime: 'automatic',
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
