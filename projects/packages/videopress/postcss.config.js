module.exports = () => ( {
	plugins: [
		require( '@wordpress/theme/postcss-plugins/postcss-ds-token-fallbacks' ).default,
		require( 'autoprefixer' ),
	],
} );
