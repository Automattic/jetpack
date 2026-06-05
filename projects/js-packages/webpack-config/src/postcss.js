/**
 * Shared PostCSS helpers for Jetpack webpack builds.
 *
 * Injects `@wordpress/theme` design-token fallbacks into bare `var(--wpds-*)`
 * references before other transforms run. See:
 * https://github.com/WordPress/gutenberg/tree/trunk/packages/theme#build-plugins
 */

const path = require( 'path' );

/**
 * Resolve a package subpath from the consuming project's dependency tree.
 *
 * @param {string} specifier - Module specifier.
 * @param {string} fromDir   - Directory of the consumer's `postcss.config.js`.
 * @return {string} Absolute path.
 */
function resolvePeer( specifier, fromDir ) {
	return require.resolve( specifier, {
		paths: [ fromDir, process.cwd(), path.join( __dirname, '../../..' ) ],
	} );
}

/**
 * Require a PostCSS-related package from the consuming project's dependency tree.
 *
 * @param {string} moduleName - Package name.
 * @param {string} fromDir    - Directory of the consumer's `postcss.config.js`.
 * @return {*} Required module export.
 */
function requirePeer( moduleName, fromDir ) {
	return require( resolvePeer( moduleName, fromDir ) );
}

/**
 * Load the WPDS token fallback PostCSS plugin when `@wordpress/theme` is available.
 *
 * @param {string} fromDir - Directory of the consumer's `postcss.config.js`.
 * @return {import('postcss').Plugin | null} WPDS token fallback plugin, if available.
 */
function loadDsTokenFallbacks( fromDir ) {
	try {
		return requirePeer( '@wordpress/theme/postcss-plugins/postcss-ds-token-fallbacks', fromDir )
			.default;
	} catch {
		// @wordpress/theme is optional; skip token fallbacks when unavailable.
		return null;
	}
}

/**
 * Build the standard PostCSS plugin list for Jetpack webpack `postcss-loader` configs.
 *
 * @param {object}  [options]            - PostCSS pipeline options.
 * @param {string}  [options.fromDir]    - Directory of the consumer `postcss.config.js`.
 * @param {boolean} [options.preserve]   - Passed to `postcss-custom-properties`.
 * @param {boolean} [options.wpdsTokens] - Include `@wordpress/theme/design-tokens.css`
 *                                       in global data for `postcss-custom-properties`.
 * @return {import('postcss').AcceptedPlugin[]} PostCSS plugins for webpack `postcss-loader`.
 */
function webpackPostcssPlugins( {
	fromDir = process.cwd(),
	preserve = false,
	wpdsTokens = false,
} = {} ) {
	const globalDataFiles = [
		resolvePeer( '@automattic/calypso-color-schemes/root-only/index.css', fromDir ),
	];

	if ( wpdsTokens ) {
		globalDataFiles.push( resolvePeer( '@wordpress/theme/design-tokens.css', fromDir ) );
	}

	return [
		loadDsTokenFallbacks( fromDir ),
		requirePeer(
			'@csstools/postcss-global-data',
			fromDir
		)( {
			files: globalDataFiles,
		} ),
		requirePeer(
			'postcss-custom-properties',
			fromDir
		)( {
			preserve,
		} ),
		requirePeer( 'autoprefixer', fromDir ),
	].filter( Boolean );
}

module.exports = {
	webpackPostcssPlugins,
};
