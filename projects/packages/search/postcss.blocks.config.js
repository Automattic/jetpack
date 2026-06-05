// Bundle-scoped postcss config for `src/search-blocks/` only — the front-end
// blocks ship to themes whose `--wp--preset--color--*` (and authors'
// `--jetpack-search-*`) variables resolve at runtime, so `preserve: true`
// keeps the `var()` chains intact and lets the cascade pick the runtime
// value when defined. postcss still emits a literal substitution alongside
// each `var()`, which serves as the static fallback for browsers /
// contexts where the variable isn't defined. The other bundles
// (inline-search, customberg, instant-search) keep `postcss.config.js`
// with `preserve: false` — `instant-search` in particular reads
// calypso-color-schemes vars that aren't shipped to the runtime.
module.exports = () => ( {
	plugins: [
		require( '@csstools/postcss-global-data' )( {
			files: [ require.resolve( '@automattic/calypso-color-schemes/root-only/index.css' ) ],
		} ),
		require( 'postcss-custom-properties' )( {
			preserve: true,
		} ),
		require( 'autoprefixer' ),
	],
} );
