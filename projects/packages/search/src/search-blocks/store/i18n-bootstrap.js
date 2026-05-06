const TEXT_DOMAIN = 'jetpack-search-pkg';
const BUILD_PREFIX = 'build/search-blocks/';

const seen = new Set();

/**
 * Lazy-load the `jetpack-search-pkg` translation .json for one entry bundle
 * and feed it into `wp.i18n.setLocaleData()`.
 *
 * Wraps the standard Jetpack runtime translation fetcher
 * (`wp.jpI18nLoader.downloadI18n`, registered as the `wp-jp-i18n-loader`
 * classic script by `Automattic\Jetpack\Assets`) — the same path
 * `@automattic/i18n-loader-webpack-plugin` injects into classic-script
 * bundles. Each entry that has its own `__()` / `_n()` calls invokes
 * `bootstrapI18n( '<bundle-filename>' )` from its own module so the loader
 * hashes the per-bundle path and fetches that bundle's translation file.
 *
 * Translations land asynchronously: deep-linked search pages render
 * source strings on first paint and re-render with locale strings once
 * the fetch resolves. Acceptable trade-off vs. inlining `setLocaleData()`
 * because we route entirely through the existing pipeline.
 *
 * Idempotent — a second call for the same `bundleFilename` is a no-op.
 *
 * @param {string} bundleFilename - Filename of the calling entry relative to the package's
 *                                `build/search-blocks/` output dir, e.g. `'store/index.js'`
 *                                or `'active-filters.js'`.
 * @return {void}
 */
export function bootstrapI18n( bundleFilename ) {
	if ( typeof bundleFilename !== 'string' || seen.has( bundleFilename ) ) {
		return;
	}
	seen.add( bundleFilename );

	const loader = ( typeof window !== 'undefined' && window.wp && window.wp.jpI18nLoader ) || null;
	if ( ! loader || typeof loader.downloadI18n !== 'function' ) {
		return;
	}

	// jp-i18n-loader prepends `state.domainPaths['jetpack-search-pkg']` (set
	// by `Assets::alias_textdomain` to `jetpack_vendor/automattic/jetpack-search/`)
	// and md5-hashes the result to match the .json filename Jetpack's
	// translation pipeline produced for our textdomain.
	const path = BUILD_PREFIX + bundleFilename;

	// Fire-and-forget. Failures (en_US default, missing .json, network) are
	// benign — strings stay in the source language.
	loader.downloadI18n( path, TEXT_DOMAIN, 'plugin' ).catch( () => undefined );
}
