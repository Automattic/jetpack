module.exports = () => ( {
	plugins: [
		require( '@wordpress/theme-build-tools/postcss-plugins/postcss-ds-token-fallbacks' ).default,
		require( 'autoprefixer' ),
	],
} );
