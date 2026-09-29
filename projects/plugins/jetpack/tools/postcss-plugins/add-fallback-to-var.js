/**
 * Replace bare `var(--color-*|--studio-*|--jp-*)` references in a CSS value string with
 * `var(--token, <fallback>)` using the provided token fallback map.
 *
 * Existing fallbacks (i.e. `var()` calls that already contain a comma)
 * are left untouched, making the function safe to run multiple times
 * (idempotent).
 *
 * Unknown `--jp-*` tokens are left as-is: that prefix is also used for
 * local component custom properties. Unknown `--color-*` / `--studio-*`
 * tokens still fail the build.
 *
 * Modeled on `@wordpress/theme`'s `add-fallback-to-var` helper:
 * https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/src/postcss-plugins/add-fallback-to-var.mjs
 *
 * @param {string}                 cssValue       - A CSS declaration value.
 * @param {Record<string, string>} tokenFallbacks - Map of CSS variable names to their fallback expressions.
 * @return {string} The value with fallbacks injected.
 */
function addFallbackToVar( cssValue, tokenFallbacks ) {
	return cssValue.replace( /var\(\s*(--(?:color|studio|jp)-[\w-]+)\s*\)/g, ( match, tokenName ) => {
		const fallback = tokenFallbacks[ tokenName ];
		if ( fallback === undefined ) {
			if ( tokenName.startsWith( '--jp-' ) ) {
				return match;
			}
			throw new Error(
				`Unknown token: ${ tokenName }. ` +
					'This token is not in Calypso color schemes / Studio / Jetpack base styles.'
			);
		}
		return `var(${ tokenName }, ${ fallback })`;
	} );
}

module.exports = { addFallbackToVar };
