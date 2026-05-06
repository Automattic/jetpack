/**
 * ESM shim that exposes the classic `wp-i18n` runtime as the
 * `@wordpress/i18n` script module.
 *
 * The Interactivity API view bundle imports `@wordpress/i18n`; webpack
 * externalizes that import as a script-module reference (see
 * `requestToExternalModule` in `tools/webpack.blocks.config.js`); WP
 * resolves the canonical `@wordpress/i18n` ID to this file via
 * `wp_register_script_module()` in `class-search-blocks.php`. The shim
 * re-exports the live functions on `window.wp.i18n`, which the classic
 * `wp-i18n` script populates synchronously before any deferred module
 * evaluates.
 *
 * Translations land on `window.wp.i18n` via `wp.jpI18nLoader.downloadI18n()`
 * (the standard async fetcher kicked off by `store/i18n-bootstrap.js`),
 * so non-English locales pick up translated strings on the next
 * reactivity tick. If `wp-i18n` was not enqueued (e.g. the page renders
 * no Jetpack Search blocks), the identity fallbacks below keep the page
 * rendering English source strings instead of throwing.
 */

const i18n = ( typeof window !== 'undefined' && window.wp && window.wp.i18n ) || {};

const identity = s => s;
const pluralIdentity = ( single, plural, count ) => ( count === 1 ? single : plural );

// Minimal `sprintf` substitute supporting the `%s`, `%d`, `%1$s`, `%2$d` forms
// used by the search blocks. Only invoked when `wp.i18n.sprintf` is missing.
const sprintfFallback = ( fmt, ...args ) => {
	let i = 0;
	return String( fmt ).replace( /%(?:(\d+)\$)?[sdf]/g, ( _, idx ) => {
		const j = idx ? parseInt( idx, 10 ) - 1 : i++;
		return String( args[ j ] );
	} );
};

export const __ = i18n.__ || identity;
export const _x = i18n._x || identity;
export const _n = i18n._n || pluralIdentity;
export const _nx = i18n._nx || pluralIdentity;
export const sprintf = i18n.sprintf || sprintfFallback;
export const isRTL = i18n.isRTL || ( () => false );
export const hasTranslation = i18n.hasTranslation || ( () => false );
export const setLocaleData = i18n.setLocaleData || ( () => undefined );
