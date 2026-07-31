const fs = require( 'fs' );

/**
 * Parse custom-property definitions from a CSS file into a fallback map.
 *
 * @param {string} filePath - Absolute path to a CSS file.
 * @return {Record<string, string>} Map of `--token` → value.
 */
function loadTokenFallbacksFromCss( filePath ) {
	const css = fs.readFileSync( filePath, 'utf8' );
	/** @type {Record<string, string>} */
	const tokenFallbacks = {};

	for ( const match of css.matchAll( /(--(?:color|studio)-[\w-]+)\s*:\s*([^;]+);/g ) ) {
		tokenFallbacks[ match[ 1 ] ] = match[ 2 ].trim();
	}

	return tokenFallbacks;
}

/**
 * Build the combined fallback map for `--color-*` and `--studio-*` tokens.
 *
 * Color Studio primitives come from `@automattic/color-studio`.
 * Calypso semantic `--color-*` tokens (and a studio mirror) come from
 * `@automattic/calypso-color-schemes` root-only sheet. Later sources win
 * on key conflicts.
 *
 * @return {Record<string, string>} Token fallback map.
 */
function buildColorTokenFallbacks() {
	return {
		...loadTokenFallbacksFromCss(
			require.resolve( '@automattic/color-studio/dist/color-properties.css' )
		),
		...loadTokenFallbacksFromCss(
			require.resolve( '@automattic/calypso-color-schemes/root-only/index.css' )
		),
	};
}

module.exports = {
	buildColorTokenFallbacks,
	loadTokenFallbacksFromCss,
};
