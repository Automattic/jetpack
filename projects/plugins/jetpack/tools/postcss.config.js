module.exports = () => ( {
	plugins: [
		require( '@wordpress/theme/postcss-plugins/postcss-ds-token-fallbacks' ).default,
		require( '@csstools/postcss-global-data' )( {
			// Provide the properties that postcss-custom-properties is going to work with.
			files: [
				require.resolve( '@automattic/calypso-color-schemes/root-only/index.css' ),
				// WPDS design tokens for postcss-custom-properties fallback substitution
				// alongside preserved `var(--wpds-*)` calls in the legacy `_inc/` dashboard.
				require.resolve( '@wordpress/theme/design-tokens.css' ),
			],
		} ),
		require( 'postcss-custom-properties' )( {
			preserve: false,
		} ),
		require( 'autoprefixer' ),
	],
} );
