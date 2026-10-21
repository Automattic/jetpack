/**
 * Standard PostCSS plugins for Jetpack projects: WPDS token fallbacks, then autoprefixer.
 *
 * @param {object}  [options]            - Options.
 * @param {boolean} [options.colorTokens] - Also add fallbacks for `--color-*`, `--studio-*` and `--jp-*` tokens.
 * @return {Array} Plugin instances for `postcssOptions.plugins`.
 */
module.exports = ( { colorTokens = false } = {} ) => [
	require( '@wordpress/theme/postcss-plugins/postcss-ds-token-fallbacks' ).default,
	...( colorTokens ? [ require( './postcss/postcss-color-token-fallbacks' ) ] : [] ),
	require( 'autoprefixer' ),
];
