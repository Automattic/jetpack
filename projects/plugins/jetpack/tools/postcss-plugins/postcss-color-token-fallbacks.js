const { addFallbackToVar } = require( './add-fallback-to-var' );
const { buildColorTokenFallbacks } = require( './build-color-token-fallbacks' );

const tokenFallbacks = buildColorTokenFallbacks();

/**
 * PostCSS plugin that injects static fallbacks into bare
 * `var(--color-*)` and `var(--studio-*)` calls for Calypso / Color Studio tokens.
 *
 * @return {import('postcss').Plugin} PostCSS plugin.
 */
function postcssColorTokenFallbacks() {
	return {
		postcssPlugin: 'postcss-color-token-fallbacks',
		/**
		 * Inject token fallbacks into a CSS declaration value.
		 *
		 * @param {import('postcss').Declaration} decl - CSS declaration.
		 */
		Declaration( decl ) {
			const updated = addFallbackToVar( decl.value, tokenFallbacks );
			if ( updated !== decl.value ) {
				decl.value = updated;
			}
		},
	};
}

postcssColorTokenFallbacks.postcss = true;

module.exports = postcssColorTokenFallbacks;
