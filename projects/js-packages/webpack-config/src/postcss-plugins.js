/**
 * Standard PostCSS plugins for Jetpack projects: WPDS token fallbacks, then autoprefixer.
 *
 * @return {Array} Plugin instances for `postcssOptions.plugins`.
 */
module.exports = () => [
	require( '@wordpress/theme/postcss-plugins/postcss-ds-token-fallbacks' ).default,
	require( 'autoprefixer' ),
];
