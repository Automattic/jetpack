module.exports = () => ( {
	plugins: [
		require( '@csstools/postcss-global-data' )( {
			files: [ require.resolve( '@automattic/calypso-color-schemes/root-only/index.css' ) ],
		} ),
		require( 'postcss-custom-properties' )( {
			preserve: false,
		} ),
		require( 'autoprefixer' ),
	],
} );
