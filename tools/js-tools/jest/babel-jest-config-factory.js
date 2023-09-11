module.exports = resolve => [
	resolve( 'babel-jest' ),
	{
		presets: [
			[ resolve( '@automattic/jetpack-webpack-config/babel/preset' ), { modules: 'commonjs' } ],
		],
		plugins: [
			[
				resolve( '@wordpress/babel-plugin-import-jsx-pragma' ),
				{
					scopeVariable: 'createElement',
					scopeVariableFrag: 'Fragment',
					source: resolve( '@wordpress/element' ),
					isDefault: false,
				},
			],
			[
				resolve( '@babel/plugin-transform-react-jsx' ),
				{
					pragma: 'createElement',
					pragmaFrag: 'Fragment',
				},
			],
		],
		babelrc: false,
		configFile: false,
	},
];
