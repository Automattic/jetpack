// A gettext call in the member-expression shape the i18n stub generator must
// recognise; uses the global rather than importing `@wordpress/i18n` so the
// fixture needs no extra dependency.
const label = (
	window as { wp?: { i18n?: { __: ( s: string, d: string ) => string } } }
 ).wp?.i18n?.__( 'Hello from fixture', 'jetpack-wp-build-polyfills' );

// A decoy with the same call shape on an unrelated object — what a bundled
// dependency's own `cache.__( key )` looks like once esbuild has inlined it
// into this bundle. It must be neither stamped nor extracted into the .pot.
// Its value feeds the export below so nothing drops it as dead code.
const cache = { __: ( key: string ) => key.toUpperCase() };
// eslint-disable-next-line @wordpress/i18n-text-domain -- Not a gettext call; the lint autofix would otherwise add the very domain this asserts must not appear.
const cached = cache.__( 'not-a-translatable-string' );

export const stage = () => label ?? cached ?? null;
