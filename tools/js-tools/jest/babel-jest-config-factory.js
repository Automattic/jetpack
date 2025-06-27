module.exports = resolve => [
	resolve( 'babel-jest' ),
	{
		presets: [
			[ resolve( '@automattic/jetpack-webpack-config/babel/preset' ), { modules: 'commonjs' } ],
		],
		babelrc: false,
		configFile: false,
	},
];
