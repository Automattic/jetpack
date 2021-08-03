/**
 * External dependencies
 */
const babelJest = require( 'babel-jest' );

module.exports = babelJest.default.createTransformer( {
	presets: [
		[ require.resolve( '@automattic/calypso-build/babel/default' ), { modules: 'commonjs' } ],
		require.resolve( '@automattic/calypso-build/babel/wordpress-element' ),
	],
	babelrc: false,
	configFile: false,
} );
