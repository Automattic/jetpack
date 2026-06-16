module.exports = resolve => [
	resolve( 'babel-jest' ),
	{
		targets: require( resolve( '@automattic/jetpack-webpack-config/targets' ) ),
		presets: [
			[ resolve( '@automattic/jetpack-webpack-config/babel/preset' ), { modules: 'commonjs' } ],
		],
		babelrc: false,
		configFile: false,
	},
];
