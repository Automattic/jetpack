/**
 * External dependencies
 */
const babelJest = require( 'babel-jest' );

module.exports = babelJest.createTransformer( {
	presets: [
		require.resolve( '@automattic/calypso-build/babel/default' ),
		require.resolve( '@automattic/calypso-build/babel/wordpress-element' ),
	],
	babelrc: false,
	configFile: false,
} );
