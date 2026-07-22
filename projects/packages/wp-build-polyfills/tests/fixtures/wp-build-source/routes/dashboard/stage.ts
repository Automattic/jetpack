// A gettext call in the member-expression shape the i18n stub generator must
// recognise; uses the global rather than importing `@wordpress/i18n` so the
// fixture needs no extra dependency.
const label = (
	window as { wp?: { i18n?: { __: ( s: string, d: string ) => string } } }
 ).wp?.i18n?.__( 'Hello from fixture', 'jetpack-wp-build-polyfills' );

export const stage = () => label ?? null;
