/**
 * Activity Log dashboard — JavaScript translation bootstrap.
 *
 * The wp-build (esbuild) pipeline externalizes `@wordpress/i18n` to the shared
 * `window.wp.i18n` singleton but, unlike the legacy webpack pipeline, never
 * wires up loading of the translation catalog — and WordPress core has no
 * `wp_set_script_translations()` equivalent for script modules. As a result the
 * dashboard ships untranslated even though the source uses explicit domains.
 *
 * Jetpack already provides the runtime loader (`wp.jpI18nLoader`, from the
 * jetpack-assets package) on the page: it hashes a bundle's plugin-relative
 * path the way WordPress names its JS translation files, fetches the catalog,
 * and installs it via `@wordpress/i18n`'s `setLocaleData()`. We just have to
 * call it. This module is registered as a boot "init module", which boot
 * `await`s before it renders the routes, so the catalog is installed before any
 * component evaluates a translated string.
 */

/**
 * Runtime shape of the `wp.jpI18nLoader` object provided by the
 * `wp-jp-i18n-loader` script (jetpack-assets package).
 */
interface JpI18nLoader {
	downloadI18n(
		path: string,
		domain: string,
		location: 'plugin' | 'theme' | 'core'
	): Promise< void >;
}

/**
 * Text domain used throughout the Activity Log dashboard source.
 */
const DOMAIN = 'jetpack-activity-log';

/**
 * Built JS bundles (paths relative to this package's root) whose strings need
 * translating. WordPress keys each JS translation file on the md5 of the
 * non-minified script path relative to the plugin root, so we always
 * reference the `.js` file even though the browser may load `.min.js`. The
 * loader prepends this package's install path (from
 * `wp.jpI18nLoader.state.domainPaths`), so the resulting hash matches the one
 * WordPress' `make-json` produced for the plugin.
 *
 * Only the route "content" bundle carries translatable strings today; add more
 * entries here if other bundles gain strings (or make this data-driven from
 * PHP once this pattern is generalized across wp-build dashboards).
 */
const BUNDLES = [ 'build/routes/dashboard/content.js' ];

/**
 * Load and install the Activity Log translation catalog before the app renders.
 */
export async function init(): Promise< void > {
	const loader = ( window as typeof window & { wp?: { jpI18nLoader?: JpI18nLoader } } ).wp
		?.jpI18nLoader;

	if ( ! loader || typeof loader.downloadI18n !== 'function' ) {
		// The loader script isn't on the page (e.g. a context where
		// jetpack-assets didn't register it). Nothing we can do; the UI falls
		// back to English.
		return;
	}

	await Promise.all(
		BUNDLES.map( path =>
			// `downloadI18n` is a no-op for `en_US` and rejects when there is no
			// catalog file (locale not translated, or translations not yet
			// generated for this build). Swallow failures so a missing catalog
			// falls back to English instead of blocking the render.
			loader.downloadI18n( path, DOMAIN, 'plugin' ).catch( () => undefined )
		)
	);
}
