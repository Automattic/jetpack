/**
 * External dependencies
 */
const babelJest = require( 'babel-jest' );

module.exports = babelJest.default.createTransformer( {
	presets: [
		[
			require.resolve( '@automattic/jetpack-webpack-config/babel/preset' ),
			{ modules: 'commonjs' },
		],
	],
	plugins: [
		[
			require.resolve( '@wordpress/babel-plugin-import-jsx-pragma' ),
			{
				scopeVariable: 'createElement',
				scopeVariableFrag: 'Fragment',
				source: '@wordpress/element',
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
	babelrc: false,
	configFile: false,
} );
