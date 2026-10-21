/**
 * Standard PostCSS plugins for Jetpack projects: WPDS token fallbacks, color/Studio/Jetpack token fallbacks, then autoprefixer.
 *
 * @return {Array} Plugin instances for `postcssOptions.plugins`.
 */
module.exports = () => [
	require( '@wordpress/theme/postcss-plugins/postcss-ds-token-fallbacks' ).default,
	require( './postcss/postcss-color-token-fallbacks' ),
	require( 'autoprefixer' ),
];
