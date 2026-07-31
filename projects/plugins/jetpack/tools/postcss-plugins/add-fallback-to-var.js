/**
 * Replace bare `var(--color-*|--studio-*)` references in a CSS value string with
 * `var(--token, <fallback>)` using the provided token fallback map.
 *
 * Existing fallbacks (i.e. `var()` calls that already contain a comma)
 * are left untouched, making the function safe to run multiple times
 * (idempotent).
 *
 * Modeled on `@wordpress/theme`'s `add-fallback-to-var` helper:
 * https://github.com/WordPress/gutenberg/blob/trunk/packages/theme/src/postcss-plugins/add-fallback-to-var.mjs
 *
 * @param {string}                 cssValue               - A CSS declaration value.
 * @param {Record<string, string>} tokenFallbacks         - Map of CSS variable names to their fallback expressions.
 * @param {object}                 [options]              - Options.
 * @param {boolean}                [options.escapeQuotes] - When true, escape `"` and `'` in fallback values.
 * @param {boolean}                [options.strict]       - When true, throw if a matched token is missing from the map.
 * @return {string} The value with fallbacks injected.
 */
function addFallbackToVar(
	cssValue,
	tokenFallbacks,
	{ escapeQuotes = false, strict = false } = {}
) {
	return cssValue.replace( /var\(\s*(--(?:color|studio)-[\w-]+)\s*\)/g, ( match, tokenName ) => {
		let fallback = tokenFallbacks[ tokenName ];
		if ( fallback === undefined ) {
			if ( strict ) {
				throw new Error(
					`Unknown color token: ${ tokenName }. ` +
						'This token is not in the Calypso / Color Studio fallback map.'
				);
			}
			return match;
		}
		if ( escapeQuotes ) {
			fallback = fallback.replaceAll( '"', '\\"' ).replaceAll( "'", "\\'" );
		}
		return `var(${ tokenName }, ${ fallback })`;
	} );
}

module.exports = { addFallbackToVar };
