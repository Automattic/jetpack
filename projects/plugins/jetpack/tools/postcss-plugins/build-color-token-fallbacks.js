const fs = require( 'fs' );

/**
 * Parse custom-property definitions from a CSS file into a fallback map.
 *
 * @param {string} filePath     - Absolute path to a CSS file.
 * @param {RegExp} tokenPattern - Pattern for supported custom properties.
 * @return {Record<string, string>} Map of `--token` → value.
 */
function loadTokenFallbacksFromCss( filePath, tokenPattern ) {
	const css = fs.readFileSync( filePath, 'utf8' );
	/** @type {Record<string, string>} */
	const tokenFallbacks = {};

	const declarationPattern = new RegExp( `(${ tokenPattern.source })\\s*:\\s*([^;]+);`, 'g' );

	for ( const match of css.matchAll( declarationPattern ) ) {
		tokenFallbacks[ match[ 1 ] ] = match[ 2 ].trim();
	}

	return tokenFallbacks;
}

/**
 * Build the combined fallback map for `--color-*`, `--studio-*`, and `--jp-*`
 * tokens.
 *
 * Color Studio primitives come from `@automattic/color-studio`.
 * Calypso semantic `--color-*` tokens (and a studio mirror) come from
 * `@automattic/calypso-color-schemes` root-only sheet. Jetpack `--jp-*`
 * custom properties come from `@automattic/jetpack-base-styles/root-variables`.
 * Later sources win on key conflicts.
 *
 * @return {Record<string, string>} Token fallback map.
 */
function buildColorTokenFallbacks() {
	const supportedTokenPattern = /--(?:color|jp|studio)-[\w-]+/;

	return {
		...loadTokenFallbacksFromCss(
			require.resolve( '@automattic/color-studio/dist/color-properties.css' ),
			supportedTokenPattern
		),
		...loadTokenFallbacksFromCss(
			require.resolve( '@automattic/calypso-color-schemes/root-only/index.css' ),
			supportedTokenPattern
		),
		...loadTokenFallbacksFromCss(
			require.resolve( '@automattic/jetpack-base-styles/root-variables' ),
			supportedTokenPattern
		),
	};
}

module.exports = {
	buildColorTokenFallbacks,
	loadTokenFallbacksFromCss,
};
